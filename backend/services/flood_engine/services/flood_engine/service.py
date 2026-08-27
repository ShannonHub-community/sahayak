"""
service.py — Flood Prediction Engine.

Implements the three services from the spec in one file (this repo keeps
each backend service as a flat `router.py` / `schemas.py` / `service.py`
module rather than nested subpackages):

    Service 1 — Ingestion            (steps 1-6)
    Service 2 — Feature Engineering  (steps 1-5)
    Service 3 — Scoring              (steps 1-5)

`run_refresh()` chains all three for a Manual or Scheduled Refresh.
`run_backtest()` reuses Feature Engineering + Scoring against a historical
`ward_readings` run_id already in the database — it makes no ingestion API
calls (no Open-Meteo/CWC network hits), which is the "no Ingestion ...
step" the spec calls out; it still has to shape those historical readings
into a feature vector before the model can score them, since that's the
model's only input contract.
"""
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Optional

import httpx
import xgboost as xgb
import numpy as np

from config import get_settings
from services.flood_engine.schemas import (
    WardReading,
    WardAttributes,
    FeatureVector,
    RiskScoreOut,
    IngestionFailureOut,
    RefreshResponse,
)

logger = logging.getLogger("flood_engine.service")

BASE_DIR = Path(__file__).resolve().parent  # services/flood_engine/


class FeatureSchemaError(Exception):
    """Raised when a ward is missing the static attributes Feature
    Engineering needs — fails loudly per spec step 2.3, never silently
    drops the ward."""


# =======================================================================
# Service 1 — Ingestion
# =======================================================================

class OpenMeteoError(Exception):
    pass


class CWCError(Exception):
    pass


async def fetch_rainfall_mm(lat: float, lon: float) -> float:
    """Step 1: latest rainfall reading for a ward centroid from Open-Meteo."""
    settings = get_settings()
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "precipitation",
        "past_days": 1,
        "forecast_days": 1,
        "timezone": "UTC",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.ingestion_source_timeout_seconds) as client:
            resp = await client.get(settings.open_meteo_base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise OpenMeteoError(f"Open-Meteo request failed: {exc}") from exc
    except ValueError as exc:
        raise OpenMeteoError(f"Open-Meteo returned non-JSON response: {exc}") from exc

    hourly = data.get("hourly") or {}
    values = hourly.get("precipitation") or []
    for value in reversed(values):
        if value is not None:
            return float(value)
    raise OpenMeteoError("Open-Meteo response missing expected 'hourly.precipitation' data")


async def fetch_discharge_m3s(station_id: Optional[str]) -> float:
    """Step 2: latest discharge reading for a ward's mapped gauge station
    from the CWC public portal / GRRR dataset."""
    if not station_id:
        raise CWCError("No CWC station id mapped for this ward")

    settings = get_settings()
    url = f"{settings.cwc_base_url}/stations/{station_id}/latest"
    try:
        async with httpx.AsyncClient(timeout=settings.ingestion_source_timeout_seconds) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise CWCError(f"CWC/GRRR request failed for station {station_id}: {exc}") from exc
    except ValueError as exc:
        raise CWCError(f"CWC/GRRR returned non-JSON response for station {station_id}: {exc}") from exc

    if "discharge_m3s" in data and data["discharge_m3s"] is not None:
        return float(data["discharge_m3s"])
    nested = data.get("data") or {}
    if "discharge" in nested and nested["discharge"] is not None:
        return float(nested["discharge"])
    raise CWCError(f"CWC/GRRR response missing expected discharge field for station {station_id}")


@lru_cache
def _load_dem_file() -> dict:
    """Step 3: static DEM values, read once and cached for the life of the
    process — never re-fetched per run. Cleared via `_load_dem_file.cache_clear()`
    in tests that need to point at a different file."""
    settings = get_settings()
    path = Path(settings.dem_file_path)
    if not path.is_absolute():
        path = BASE_DIR.parent.parent / settings.dem_file_path
    if not path.exists():
        logger.warning("DEM file not found at %s — DEM values will be unavailable", path)
        return {}
    with open(path) as f:
        return json.load(f)


def get_dem_values(ward_id: str) -> dict:
    """Returns {"elevation_m":..., "slope":...} for a ward, or {} if unknown."""
    return _load_dem_file().get(ward_id, {})


async def run_ingestion(
    wards: list[WardAttributes], run_id: str
) -> tuple[list[WardReading], list[IngestionFailureOut]]:
    """
    Steps 4-6: pulls rainfall + discharge + DEM per ward, normalizes into
    one row per ward, and collects per-source/per-ward failures without
    letting one ward's failure block the others.
    """
    readings: list[WardReading] = []
    failures: list[IngestionFailureOut] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for ward in wards:
        rainfall_mm: Optional[float] = None
        discharge_m3s: Optional[float] = None
        sources_ok = []

        if ward.centroid_lat is None or ward.centroid_lon is None:
            # ward_attributes has no centroid columns in the current schema —
            # treat exactly like any other missing-source failure rather
            # than crashing fetch_rainfall_mm() with None coordinates.
            logger.warning("Ingestion: no centroid_lat/centroid_lon for %s — skipping Open-Meteo", ward.ward_id)
            failures.append(IngestionFailureOut(
                run_id=run_id, source="open-meteo", ward_id=ward.ward_id,
                error="ward_attributes has no centroid_lat/centroid_lon for this ward",
            ))
        else:
            try:
                rainfall_mm = await fetch_rainfall_mm(ward.centroid_lat, ward.centroid_lon)
                sources_ok.append("open-meteo")
            except OpenMeteoError as exc:
                logger.warning("Ingestion: Open-Meteo failed for %s: %s", ward.ward_id, exc)
                failures.append(IngestionFailureOut(run_id=run_id, source="open-meteo", ward_id=ward.ward_id, error=str(exc)))

        try:
            discharge_m3s = await fetch_discharge_m3s(ward.cwc_station_id)
            sources_ok.append("cwc")
        except CWCError as exc:
            logger.warning("Ingestion: CWC failed for %s: %s", ward.ward_id, exc)
            failures.append(IngestionFailureOut(run_id=run_id, source="cwc", ward_id=ward.ward_id, error=str(exc)))

        dem = get_dem_values(ward.ward_id)
        elevation_m = dem.get("elevation_m", ward.elevation_m)
        slope = dem.get("slope", ward.slope)
        if dem:
            sources_ok.append("dem")
        else:
            failures.append(
                IngestionFailureOut(run_id=run_id, source="dem", ward_id=ward.ward_id, error="No DEM values cached for ward")
            )

        readings.append(
            WardReading(
                ward_id=ward.ward_id,
                rainfall_mm=rainfall_mm,
                discharge_m3s=discharge_m3s,
                elevation_m=elevation_m,
                slope=slope,
                source="+".join(sources_ok) if sources_ok else "none",
                run_id=run_id,
                fetched_at=now_iso,
            )
        )

    return readings, failures


WARD_READINGS_DB_COLUMNS = ("ward_id", "rainfall_mm", "discharge_m3s", "source", "fetched_at")


def persist_ingestion(supabase, readings: list[WardReading]) -> None:
    """Step 5 (insert, append-only).

    Only writes the columns that actually exist on `ward_readings`
    (ward_id/rainfall_mm/discharge_m3s/source/fetched_at). elevation_m/
    slope/run_id are dropped from the insert — they stay on the in-memory
    WardReading objects for build_features() to use, but there's nowhere
    to persist them without adding columns.

    Failures are no longer written here — there is no `ingestion_failures`
    table in the current schema. The caller (run_refresh) logs each
    failure into `ticket_inquiries` against that run's ticket instead —
    see log_ingestion_failure().
    """
    if readings:
        rows = [{k: v for k, v in r.model_dump().items() if k in WARD_READINGS_DB_COLUMNS} for r in readings]
        supabase.table("ward_readings").insert(rows).execute()


# =======================================================================
# Service 2 — Feature Engineering
# =======================================================================

# Expected numeric range each feature was trained on — used by Scoring to
# flag (not silently pass) out-of-distribution inputs. Kept here, next to
# the features themselves, so schema drift is easy to catch in one place.
FEATURE_TRAINING_RANGES = {
    "rainfall_mm": (0.0, 300.0),
    "rainfall_accum_window": (0.0, 600.0),
    "discharge_m3s": (0.0, 5000.0),
    "discharge_trend": (-1000.0, 1000.0),
    "elevation_m": (-5.0, 500.0),
    "slope": (0.0, 45.0),
    "drainage_density": (0.0, 10.0),
    "historical_flood_count": (0, 100),
    "drainage_adjusted_rainfall": (0.0, 300.0),
}

FEATURE_ORDER = [
    "rainfall_mm",
    "rainfall_accum_window",
    "discharge_m3s",
    "discharge_trend",
    "elevation_m",
    "slope",
    "drainage_density",
    "historical_flood_count",
    "drainage_adjusted_rainfall",
]


def get_ward_attributes(supabase) -> dict[str, WardAttributes]:
    resp = supabase.table("ward_attributes").select("*").execute()
    return {row["ward_id"]: WardAttributes(**row) for row in (resp.data or [])}


def _recent_readings(supabase, ward_id: str, exclude_fetched_at: Optional[str] = None, limit: int = 20) -> list[dict]:
    """Recent ward_readings rows, most recent first.

    `ward_readings` has no run_id column, so "exclude the current run's
    own row" (needed because it was already persisted by the time this
    runs) is done by excluding rows with the same fetched_at value —
    every reading in one ingestion pass shares the exact same fetched_at
    timestamp (see run_ingestion's `now_iso`), so this achieves the same
    grouping the old run_id-based exclusion did.
    """
    resp = (
        supabase.table("ward_readings")
        .select("*")
        .eq("ward_id", ward_id)
        .order("fetched_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = resp.data or []
    if exclude_fetched_at:
        rows = [r for r in rows if r.get("fetched_at") != exclude_fetched_at]
    return rows


def _rainfall_accum_window(
    supabase, ward_id: str, latest_rainfall: float, window_hours: int,
    reference_time: datetime, exclude_fetched_at: str,
) -> float:
    """
    Sum of rainfall_mm across readings for this ward within the configured
    accumulation window, measured back from `reference_time` (the reading's
    own fetched_at) rather than wall-clock now — this keeps the math
    correct whether it's called right after ingestion or later, from
    Backtest, against old historical readings. Excludes the current run's
    own row (already persisted by the time this runs, matched by shared
    fetched_at — see _recent_readings) to avoid double counting it on top
    of `latest_rainfall`.
    """
    settings = get_settings()
    cutoff = reference_time - timedelta(hours=window_hours or settings.rainfall_accumulation_window_hours)
    total = latest_rainfall or 0.0
    for row in _recent_readings(supabase, ward_id, exclude_fetched_at=exclude_fetched_at):
        try:
            fetched_at = datetime.fromisoformat(row["fetched_at"].replace("Z", "+00:00"))
        except (KeyError, ValueError, TypeError):
            continue
        if fetched_at >= cutoff and row.get("rainfall_mm") is not None:
            total += float(row["rainfall_mm"])
    return total


def _discharge_trend(supabase, ward_id: str, latest_discharge: float, current_fetched_at: str) -> float:
    """Positive = rising, negative = falling, vs. the previous reading."""
    history = _recent_readings(supabase, ward_id, exclude_fetched_at=current_fetched_at, limit=1)
    if not history or history[0].get("discharge_m3s") is None:
        return 0.0
    previous = float(history[0]["discharge_m3s"])
    return (latest_discharge or 0.0) - previous


def build_features(supabase, readings: list[WardReading]) -> list[FeatureVector]:
    """
    Steps 1-4: joins each reading against `ward_attributes`, fails loudly
    if a ward's static profile is missing, then derives the model-ready
    feature vector. Step 5 (pass to Scoring) happens by simply returning
    the list — no intermediate table.
    """
    attrs_by_ward = get_ward_attributes(supabase)
    settings = get_settings()
    features: list[FeatureVector] = []

    for reading in readings:
        attrs = attrs_by_ward.get(reading.ward_id)
        if attrs is None:
            raise FeatureSchemaError(
                f"Ward '{reading.ward_id}' has a reading but no row in ward_attributes — "
                "cannot build features without static attributes."
            )
        missing = [
            field
            for field in ("drainage_density", "historical_flood_count")
            if getattr(attrs, field) is None
        ]
        if missing:
            raise FeatureSchemaError(
                f"Ward '{reading.ward_id}' is missing required static attributes: {missing}"
            )

        rainfall_mm = reading.rainfall_mm or 0.0
        discharge_m3s = reading.discharge_m3s or 0.0
        elevation_m = reading.elevation_m if reading.elevation_m is not None else (attrs.elevation_m or 0.0)
        slope = reading.slope if reading.slope is not None else (attrs.slope or 0.0)
        drainage_density = attrs.drainage_density or 0.0

        try:
            reference_time = datetime.fromisoformat(reading.fetched_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            reference_time = datetime.now(timezone.utc)

        rainfall_accum_window = _rainfall_accum_window(
            supabase, reading.ward_id, rainfall_mm, settings.rainfall_accumulation_window_hours,
            reference_time, exclude_fetched_at=reading.fetched_at,
        )
        discharge_trend = _discharge_trend(supabase, reading.ward_id, discharge_m3s, reading.fetched_at)
        drainage_adjusted_rainfall = rainfall_mm / (1.0 + drainage_density)

        features.append(
            FeatureVector(
                ward_id=reading.ward_id,
                rainfall_mm=rainfall_mm,
                rainfall_accum_window=rainfall_accum_window,
                discharge_m3s=discharge_m3s,
                discharge_trend=discharge_trend,
                elevation_m=elevation_m,
                slope=slope,
                drainage_density=drainage_density,
                historical_flood_count=attrs.historical_flood_count,
                drainage_adjusted_rainfall=drainage_adjusted_rainfall,
            )
        )

    return features


# =======================================================================
# Service 3 — Scoring
# =======================================================================

@lru_cache
def load_model() -> xgb.Booster:
    """
    Step 1: loads the trained XGBoost model file. If no artifact exists
    yet at the configured path (e.g. fresh environment, ML team hasn't
    dropped one in), bootstraps a small fallback model on synthetic data
    so the pipeline is runnable end-to-end for demo/testing — this is
    logged loudly as a fallback, never silently mistaken for the real
    trained model.
    """
    settings = get_settings()
    path = Path(settings.flood_model_path)
    if not path.is_absolute():
        path = BASE_DIR.parent.parent / settings.flood_model_path

    if path.exists():
        booster = xgb.Booster()
        booster.load_model(str(path))
        return booster

    logger.warning(
        "No trained model found at %s — bootstrapping a fallback demo model. "
        "Replace this file with the real trained artifact before production use.",
        path,
    )
    booster = _bootstrap_fallback_model()
    path.parent.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(path))
    return booster


def _bootstrap_fallback_model() -> xgb.Booster:
    """Trains a tiny XGBoost model on synthetic data so the scoring stage
    has something real to run inference against out of the box."""
    rng = np.random.default_rng(42)
    n = 500
    X = rng.uniform(
        low=[r[0] for r in FEATURE_TRAINING_RANGES.values()],
        high=[r[1] for r in FEATURE_TRAINING_RANGES.values()],
        size=(n, len(FEATURE_ORDER)),
    )
    # Rough heuristic label: more rainfall/discharge + lower elevation/drainage -> higher risk
    rainfall, rainfall_accum, discharge, disch_trend, elevation, slope, drainage, hist_floods, adj_rainfall = X.T
    risk = (
        0.35 * (rainfall / 300.0)
        + 0.20 * (rainfall_accum / 600.0)
        + 0.20 * (discharge / 5000.0)
        + 0.10 * (hist_floods / 100.0)
        - 0.15 * (elevation / 500.0)
        - 0.10 * (drainage / 10.0)
    )
    y = 1.0 / (1.0 + np.exp(-6 * (risk - risk.mean())))  # squashed to ~0-1

    dtrain = xgb.DMatrix(X, label=y, feature_names=FEATURE_ORDER)
    params = {"objective": "reg:logistic", "max_depth": 4, "eta": 0.3}
    return xgb.train(params, dtrain, num_boost_round=25)


def score_wards(features: list[FeatureVector], run_id: str, run_type: Optional[str] = None) -> list[RiskScoreOut]:
    """Steps 2-3: runs inference per ward, clips to 0-100, and flags any
    feature that falls outside its expected training range.

    `run_type` is optional here purely for backward compatibility with
    existing callers/tests that only pass run_id — it isn't used by the
    scoring math itself, only later by persist_scores() to know what to
    write into risk_scores.run_type (there's no run_id column to persist
    it under directly)."""
    if not features:
        return []

    settings = get_settings()
    booster = load_model()

    matrix = np.array([[getattr(f, name) for name in FEATURE_ORDER] for f in features])
    dmatrix = xgb.DMatrix(matrix, feature_names=FEATURE_ORDER)
    raw_scores = booster.predict(dmatrix)

    now_iso = datetime.now(timezone.utc).isoformat()
    results: list[RiskScoreOut] = []
    for feature, raw in zip(features, raw_scores):
        score = float(np.clip(raw * 100.0, 0.0, 100.0))

        flagged, reasons = False, []
        for name in FEATURE_ORDER:
            value = getattr(feature, name)
            low, high = FEATURE_TRAINING_RANGES[name]
            if value < low or value > high:
                flagged = True
                reasons.append(f"{name}={value} outside expected [{low}, {high}]")

        results.append(
            RiskScoreOut(
                ward_id=feature.ward_id,
                run_id=run_id,
                score=round(score, 2),
                model_version=settings.flood_model_version,
                flagged=flagged,
                flag_reason="; ".join(reasons) if reasons else None,
                created_at=now_iso,
            )
        )
    return results


def persist_scores(supabase, scores: list[RiskScoreOut], run_type: Optional[str] = None) -> None:
    """Step 4: insert one row per ward into `risk_scores` (append-only).

    Maps onto the real risk_scores columns (ward_id/score/model_version/
    run_type/scored_at). run_id/flagged/flag_reason have no column to
    live in — they stay on the RiskScoreOut objects returned to the
    caller (so the API response is unaffected) but aren't persisted.
    `created_at` on the pydantic model is written into the `scored_at`
    column, and `run_type` (e.g. 'manual'/'scheduled'/'backtest') is
    passed in separately since RiskScoreOut carries run_id, not run_type.
    """
    if not scores:
        return
    rows = [
        {
            "ward_id": s.ward_id,
            "score": s.score,
            "model_version": s.model_version,
            "run_type": run_type,
            "scored_at": s.created_at,
        }
        for s in scores
    ]
    supabase.table("risk_scores").insert(rows).execute()


# ---------------------------------------------------------------------
# Audit trail — there is no dedicated audit_log table in the current
# schema. Per-run audit events are logged into `tickets` (one ticket per
# refresh/backtest run) with per-failure and summary notes attached as
# `ticket_inquiries` rows, matching how the rest of the app does audit
# logging (tickets = central audit trail, per the schema doc).
# ---------------------------------------------------------------------

def create_run_ticket(
    supabase, run_id: str, event_type: str, trigger_type: str,
    triggered_by: Optional[str], started_at: str,
) -> str:
    """Opens a ticket representing one refresh/backtest run. Returns the
    new ticket's id so failures/summary can be attached to it as the run
    progresses."""
    resp = supabase.table("tickets").insert(
        {
            "order_name": f"flood-engine-{event_type}-{run_id}",
            "type": f"flood_engine_{event_type}",
            "department": "flood_engine",
            "status": "running",
            "issued_by": triggered_by,
            "executed_by": "flood_engine_service",
            "source": trigger_type,
            "created_at": started_at,
            "updated_at": started_at,
        }
    ).execute()
    return resp.data[0]["id"]


def log_ingestion_failure(supabase, ticket_id: str, failure: IngestionFailureOut) -> None:
    """One ticket_inquiries row per ingestion failure, attached to the
    run's ticket — replaces the old ingestion_failures table insert."""
    supabase.table("ticket_inquiries").insert(
        {
            "ticket_id": ticket_id,
            "question": f"ingestion failure: {failure.source} (ward={failure.ward_id or 'unknown'})",
            "response": failure.error,
            "asked_by": "flood_engine_ingestion",
            "status": "failed",
        }
    ).execute()


def finalize_run_ticket(
    supabase, ticket_id: str, status: str, wards_processed: int, wards_failed: int,
    model_version: str, finished_at: str, detail: Optional[str] = None,
) -> None:
    """Closes out the run's ticket with final status and a summary note
    — replaces the old audit_log insert at the end of a run."""
    supabase.table("tickets").update(
        {"status": status, "updated_at": finished_at, "revert_reason": detail}
    ).eq("id", ticket_id).execute()

    summary = f"wards_processed={wards_processed}, wards_failed={wards_failed}, model_version={model_version}"
    supabase.table("ticket_inquiries").insert(
        {
            "ticket_id": ticket_id,
            "question": "run summary",
            "response": f"{summary}; detail={detail}" if detail else summary,
            "asked_by": "flood_engine_service",
            "status": "answered",
            "answered_at": finished_at,
        }
    ).execute()


# =======================================================================
# Orchestration — Manual / Scheduled Refresh chain, and Backtest
# =======================================================================

async def run_refresh(supabase, trigger_type: str = "manual", triggered_by: Optional[str] = None) -> RefreshResponse:
    """Chains Ingestion -> Feature Engineering -> Scoring for one refresh."""
    settings = get_settings()
    run_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()
    ticket_id = create_run_ticket(supabase, run_id, "refresh", trigger_type, triggered_by, started_at)

    wards_rows = supabase.table("ward_attributes").select("*").execute().data or []
    wards = [WardAttributes(**row) for row in wards_rows]

    if not wards:
        finalize_run_ticket(
            supabase, ticket_id, "failed", 0, 0, settings.flood_model_version,
            datetime.now(timezone.utc).isoformat(), detail="No wards found in ward_attributes",
        )
        return RefreshResponse(
            run_id=run_id, trigger_type=trigger_type, triggered_by=triggered_by,
            wards_processed=0, wards_failed=0, model_version=settings.flood_model_version,
            status="failed", scores=[], failures=[],
        )

    readings, failures = await run_ingestion(wards, run_id)
    persist_ingestion(supabase, readings)
    for failure in failures:
        log_ingestion_failure(supabase, ticket_id, failure)

    # Only build features for wards that actually got a reading
    usable_readings = [r for r in readings if r.rainfall_mm is not None or r.discharge_m3s is not None]

    try:
        features = build_features(supabase, usable_readings)
    except FeatureSchemaError as exc:
        finalize_run_ticket(
            supabase, ticket_id, "failed", 0, len(wards), settings.flood_model_version,
            datetime.now(timezone.utc).isoformat(), detail=str(exc),
        )
        raise

    scores = score_wards(features, run_id, trigger_type)
    persist_scores(supabase, scores, trigger_type)

    scored_ward_ids = {s.ward_id for s in scores}
    failed_ward_ids = {f.ward_id for f in failures if f.ward_id and f.ward_id not in scored_ward_ids}
    wards_processed = len(scores)
    wards_failed = len(failed_ward_ids)
    status = "success" if wards_failed == 0 else ("partial_failure" if wards_processed else "failed")

    finalize_run_ticket(
        supabase, ticket_id, status, wards_processed, wards_failed,
        settings.flood_model_version, datetime.now(timezone.utc).isoformat(),
    )

    return RefreshResponse(
        run_id=run_id,
        trigger_type=trigger_type,
        triggered_by=triggered_by,
        wards_processed=wards_processed,
        wards_failed=wards_failed,
        model_version=settings.flood_model_version,
        status=status,
        scores=scores,
        failures=failures,
    )


def run_backtest(supabase, source_run_id: str, triggered_by: Optional[str] = None) -> RefreshResponse:
    """
    Reuses Feature Engineering + Scoring against a historical `ward_readings`
    batch already in the database. Makes no ingestion API calls. Writes its
    own risk_scores rows (append-only), and logs the run as a ticket.

    NOTE: `ward_readings` has no run_id column, so `source_run_id` here is
    actually matched against `fetched_at` — every reading from one
    ingestion pass shares the same fetched_at timestamp, which is what a
    caller should pass in (e.g. the fetched_at of a prior run, obtainable
    via GET /flood-engine/risk-scores/latest or the ward_readings table
    directly). The parameter name/API contract (`run_id`) is kept as-is
    for compatibility with router.py's BacktestRequest.
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc).isoformat()

    rows = supabase.table("ward_readings").select("*").eq("fetched_at", source_run_id).execute().data or []
    if not rows:
        raise ValueError(f"No ward_readings found with fetched_at '{source_run_id}'")

    readings = [WardReading(**row) for row in rows]
    backtest_run_id = str(uuid.uuid4())
    ticket_id = create_run_ticket(supabase, backtest_run_id, "backtest", "backtest", triggered_by, started_at)

    try:
        features = build_features(supabase, readings)
    except FeatureSchemaError as exc:
        finalize_run_ticket(
            supabase, ticket_id, "failed", 0, len(readings), settings.flood_model_version,
            datetime.now(timezone.utc).isoformat(), detail=f"source_run_id={source_run_id}; {exc}",
        )
        raise

    scores = score_wards(features, backtest_run_id, "backtest")
    persist_scores(supabase, scores, "backtest")

    status = "success" if scores else "failed"
    finalize_run_ticket(
        supabase, ticket_id, status, len(scores), 0, settings.flood_model_version,
        datetime.now(timezone.utc).isoformat(), detail=f"source_run_id={source_run_id}",
    )

    return RefreshResponse(
        run_id=backtest_run_id,
        trigger_type="backtest",
        triggered_by=triggered_by,
        wards_processed=len(scores),
        wards_failed=0,
        model_version=settings.flood_model_version,
        status=status,
        scores=scores,
        failures=[],
    )


def get_latest_risk_scores(supabase) -> list[RiskScoreOut]:
    """Most recent risk_scores row per ward — what the Command Dashboard
    heatmap and Resource Allocation Optimizer read.

    risk_scores has no run_id/flagged/flag_reason/created_at columns, so
    those are reconstructed on read: run_id is set to the stored run_type
    (closest available correlation key), created_at is read from
    scored_at, and flagged/flag_reason default to False/None since
    out-of-range flagging isn't persisted — it's only available on the
    RefreshResponse returned at scoring time, not on a later re-read.
    """
    rows = supabase.table("risk_scores").select("*").order("scored_at", desc=True).execute().data or []
    latest_by_ward: dict[str, dict] = {}
    for row in rows:
        if row["ward_id"] not in latest_by_ward:
            latest_by_ward[row["ward_id"]] = row
    return [
        RiskScoreOut(
            ward_id=row["ward_id"],
            run_id=row.get("run_type") or "",
            score=row["score"],
            model_version=row["model_version"],
            flagged=False,
            flag_reason=None,
            created_at=row.get("scored_at"),
        )
        for row in latest_by_ward.values()
    ]


def get_audit_log(supabase, limit: int = 20) -> list[dict]:
    """Recent flood-engine run history. There's no dedicated audit_log
    table — this reads the tickets opened by create_run_ticket() for
    each refresh/backtest run, filtered to this feature's department."""
    return (
        supabase.table("tickets")
        .select("*")
        .eq("department", "flood_engine")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
        or []
    )
