"""
schemas.py — data shapes for the Flood Prediction Engine.

Covers both the HTTP surface (router.py request/response models) and the
internal shapes passed between the three stages inside service.py
(ingestion -> feature engineering -> scoring), so a change to what a
"ward reading" or "risk score" looks like only has to happen in one place.
"""
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# HTTP request models (router.py)
# ---------------------------------------------------------------------

class RefreshRequest(BaseModel):
    """POST /flood-engine/refresh body. `trigger_type` distinguishes a
    DDMA-triggered manual refresh from a scheduler-triggered one, per spec."""
    trigger_type: str = Field(default="manual", pattern="^(manual|scheduled)$")
    triggered_by: Optional[str] = None  # DDMA user id, or 'scheduler'


class BacktestRequest(BaseModel):
    """POST /flood-engine/backtest body — reuses Scoring against a
    pre-loaded historical ward_readings run, no ingestion/feature step."""
    run_id: str  # an existing ward_readings run_id to score retroactively
    triggered_by: Optional[str] = None


# ---------------------------------------------------------------------
# Internal pipeline shapes (service.py)
# ---------------------------------------------------------------------

class WardReading(BaseModel):
    """One normalized row from Ingestion step 4.

    NOTE: the real `ward_readings` table only has
    id/ward_id/rainfall_mm/discharge_m3s/source/fetched_at — no
    elevation_m/slope/run_id columns. Those three stay on this in-memory
    model (elevation_m/slope are still needed as a fallback in
    build_features; run_id is still useful for logging/correlation) but
    are stripped out before the row is written to `ward_readings` — see
    persist_ingestion(). run_id is Optional because rows read back from
    the DB (e.g. during backtest) won't have one.
    """
    ward_id: str
    rainfall_mm: Optional[float] = None
    discharge_m3s: Optional[float] = None
    elevation_m: Optional[float] = None
    slope: Optional[float] = None
    source: str
    run_id: Optional[str] = None
    fetched_at: str


class WardAttributes(BaseModel):
    """Static per-ward profile from `ward_attributes`.

    NOTE: the current `ward_attributes` table (per the 18-table schema)
    only has ward_id/elevation_m/slope/drainage_density/
    historical_flood_count — no district/name/centroid_lat/centroid_lon/
    cwc_station_id columns. Those four are kept here as Optional so a row
    built from the real table doesn't fail validation; run_ingestion()
    treats a missing centroid as a per-source ingestion failure for that
    ward rather than crashing, the same way a missing cwc_station_id
    already does.
    """
    ward_id: str
    district: Optional[str] = None
    name: Optional[str] = None
    centroid_lat: Optional[float] = None
    centroid_lon: Optional[float] = None
    elevation_m: Optional[float] = None
    slope: Optional[float] = None
    drainage_density: Optional[float] = None
    historical_flood_count: Optional[int] = None
    cwc_station_id: Optional[str] = None


class FeatureVector(BaseModel):
    """Model-ready features for one ward, produced by Feature Engineering
    and passed directly to Scoring — never persisted separately."""
    ward_id: str
    rainfall_mm: float
    rainfall_accum_window: float          # rainfall accumulation window feature
    discharge_m3s: float
    discharge_trend: float                # positive = rising, negative = falling
    elevation_m: float
    slope: float
    drainage_density: float
    historical_flood_count: int
    drainage_adjusted_rainfall: float     # rainfall_mm adjusted by drainage density


class RiskScoreOut(BaseModel):
    model_config = {"protected_namespaces": ()}

    ward_id: str
    run_id: str
    score: float
    model_version: str
    flagged: bool = False
    flag_reason: Optional[str] = None
    created_at: Optional[str] = None


class IngestionFailureOut(BaseModel):
    run_id: str
    source: str            # 'open-meteo' | 'cwc' | 'dem'
    ward_id: Optional[str] = None
    error: str


class RefreshResponse(BaseModel):
    """Response for both /refresh and /backtest — the full run summary."""
    model_config = {"protected_namespaces": ()}

    run_id: str
    trigger_type: str          # 'manual' | 'scheduled' | 'backtest'
    triggered_by: Optional[str] = None
    wards_processed: int
    wards_failed: int
    model_version: str
    status: str                 # success | partial_failure | failed
    scores: list[RiskScoreOut] = []
    failures: list[IngestionFailureOut] = []
