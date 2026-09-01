"""
<<<<<<< HEAD
News Report Service - business logic.

Admin side (News Report tab):
    create_alert / list_alerts / get_alert / update_alert
    -> create, list (all statuses, for the admin table view), and
       update/archive an existing alert in `Public_Alerts`.

Public side (Citizen App "Live Updates" tab):
    get_public_feed
    -> a simple read that pulls the latest 20 *active* alerts, ordered
       by timestamp newest first. Only exposes title/message/severity/
       timestamp/state - no admin/internal fields. Optionally filtered
       to a single Indian state.
    translate_alerts / get_audio_for_alert / get_state_from_coordinates
    -> backend halves of the three Live Updates additions from Prompt 6:
       translation toggle, per-card text-to-speech, and GPS-based state
       filtering. All the actual Sarvam API calls live in sarvam_client;
       this module just wires requests to it and fails gracefully.
=======
News Report & Public Communications Service - business logic & mock datasets.
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
from pydantic import BaseModel

<<<<<<< HEAD
from backend.shared.database import get_db
from backend.services.news_report import sarvam_client
from backend.services.news_report.geo_lookup import lookup_state
from backend.services.news_report.schemas import (
    AlertCreateRequest,
    AlertUpdateRequest,
    StateLookupRequest,
    TranslateRequest,
    TTSRequest,
)

PUBLIC_FEED_PAGE_SIZE = 20

_state_column_ensured = False


def _ensure_state_column() -> None:
    """Best-effort migration: add the `state` column to Public_Alerts if
    it isn't there yet. Guarded so it only runs once per process, and
    swallows the "duplicate column" error SQLite raises if it's already
    present (or does nothing useful if the table doesn't exist at all -
    that's a genuine setup problem the normal queries will surface)."""
    global _state_column_ensured
    if _state_column_ensured:
        return
    try:
        with get_db() as db:
            db.execute("ALTER TABLE Public_Alerts ADD COLUMN state TEXT")
    except Exception:
        pass
    finally:
        _state_column_ensured = True
=======
from services.news_report.schemas import AlertCreateRequest, AlertUpdateRequest

PUBLIC_FEED_PAGE_SIZE = 20

# In-memory storage for active alerts
INITIAL_ALERTS: List[Dict[str, Any]] = [
    {
        "alert_id": 1,
        "title": "RED ALERT: Morbe Dam Secondary Spillway Gate 2 Opening",
        "message": "Water levels at Morbe Reservoir have exceeded 88.4m FSL. Controlled discharge of 4,800 cusecs commenced into Patalganga basin. All riverine communities must evacuate to designated relief camps immediately.",
        "severity": "critical",
        "status": "active",
        "created_by": "State Disaster Management Authority / CWC",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 2,
        "title": "EVACUATION NOTICE: Sector 4 Roha Low-Lying Wards",
        "message": "Waterlogging depth exceeding 1.2m near Roha Railway Station and Bazar Peth. 45 NDRF personnel and motorized rescue boats deployed. Evacuees proceed towards Zilla Parishad School Shelter.",
        "severity": "critical",
        "status": "active",
        "created_by": "Raigad District Disaster Operations",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 3,
        "title": "FLASH FLOOD WATCH: Panvel-Pen Highway Inundation",
        "message": "NH-66 submerged between km 42 and km 48. Heavy vehicular transit suspended. Light rescue ambulances prioritized along high-ground bypass.",
        "severity": "warning",
        "status": "active",
        "created_by": "Highway Traffic Police & EOC",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 4,
        "title": "RELIEF ADVISORY: Clean Drinking Water Distribution",
        "message": "Packaged mineral water and ORS packets available at Panvel Community Shelter A and Pen Town Hall. Medical teams stationed for water-borne pathogen screening.",
        "severity": "info",
        "status": "active",
        "created_by": "Public Health Department",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
]

MOCK_METRICS = {
    "sms_dispatched": 14250,
    "active_geofences": 6,
    "press_releases": 4,
    "delivered_pct": 98.4,
}

MOCK_ZONES = [
    {
        "zone_id": "zone-01",
        "zone_name": "Sector 4 (Roha Lowlands)",
        "evacuation_status": "Mandatory",
        "flood_depth_m": 1.4,
        "population_at_risk": 4200,
    },
    {
        "zone_id": "zone-02",
        "zone_name": "Sector 3 (Panvel Old Town)",
        "evacuation_status": "Advisory",
        "flood_depth_m": 0.8,
        "population_at_risk": 2800,
    },
    {
        "zone_id": "zone-03",
        "zone_name": "Sector 2 (Pen Basin)",
        "evacuation_status": "Alert",
        "flood_depth_m": 0.5,
        "population_at_risk": 1500,
    },
]

MOCK_PRESS_TEMPLATES = [
    {"id": "tmpl-01", "name": "Standard Dam Discharge Bulletin"},
    {"id": "tmpl-02", "name": "Evacuation & Safe Route Order"},
    {"id": "tmpl-03", "name": "Daily Rescue Operations Summary"},
]

MOCK_PRESS_RELEASES = [
    {
        "id": "pr-01",
        "template_id": "tmpl-01",
        "title": "Morbe Dam Discharge & Coastal Flood Measures",
        "content": "Official press release regarding controlled water release and flood containment in Raigad district.",
        "published_by": "District Information Officer",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }
]

MOCK_TIMELINE_ENTRIES = [
    {
        "id": "tl-01",
        "title": "NDRF Unit 5 Reaches Roha Sector 4",
        "details": "6 rescue inflatable boats dispatched with 45 trained swift-water operators.",
        "timestamp": "10:30 IST",
        "public_visible": True,
    },
    {
        "id": "tl-02",
        "title": "Morbe Reservoir Gate #2 Raised by 0.5m",
        "details": "Controlled discharge rate set to 4,800 cusecs as per dam safety manual.",
        "timestamp": "09:45 IST",
        "public_visible": True,
    },
]
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5


def create_alert(req: AlertCreateRequest) -> dict:
<<<<<<< HEAD
    _ensure_state_column()
    state = req.state.strip() if req.state else None
    with get_db() as db:
        cur = db.execute(
            """INSERT INTO Public_Alerts (title, message, severity, created_by, state)
               VALUES (?, ?, ?, ?, ?)""",
            (req.title.strip(), req.message.strip(), req.severity, req.created_by, state),
        )
        alert_id = cur.lastrowid
        row = db.execute("SELECT * FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
    return dict(row)
=======
    new_id = len(INITIAL_ALERTS) + 1
    record = {
        "alert_id": new_id,
        "title": req.title.strip(),
        "message": req.message.strip(),
        "severity": req.severity,
        "status": "active",
        "created_by": req.created_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    INITIAL_ALERTS.insert(0, record)
    return record
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5


def list_alerts(status: Optional[str] = None, page: int = 1, page_size: int = 20) -> list[dict]:
    results = list(INITIAL_ALERTS)
    if status:
        results = [a for a in results if a.get("status") == status]
    return results


def get_alert(alert_id: int) -> dict:
    item = next((a for a in INITIAL_ALERTS if a.get("alert_id") == alert_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Alert not found")
    return item


def update_alert(alert_id: int, req: AlertUpdateRequest) -> dict:
<<<<<<< HEAD
    _ensure_state_column()
    fields = req.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update")

    # Allow explicitly clearing state back to nationwide with "".
    if "state" in fields and fields["state"] == "":
        fields["state"] = None

    set_clause = ", ".join(f"{col} = ?" for col in fields.keys())
    values = list(fields.values())

    with get_db() as db:
        existing = db.execute("SELECT alert_id FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Alert not found")

        db.execute(
            f"UPDATE Public_Alerts SET {set_clause}, updated_at = datetime('now') WHERE alert_id = ?",
            (*values, alert_id),
        )
        row = db.execute("SELECT * FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
    return dict(row)


# ---------------------------------------------------------------------
# Public: Live Updates feed
# ---------------------------------------------------------------------
def get_public_feed(page: int = 1, state: str | None = None) -> dict:
    """Triggered by the user loading the "Live Updates" tab. Pulls the
    latest 20 active alerts, ordered by timestamp newest first, reading
    only title/message/severity/state/timestamp from Public_Alerts.

    When `state` is given (e.g. resolved from the citizen's GPS via
    `get_state_from_coordinates`), only alerts targeted at that state
    plus nationwide alerts (state IS NULL) are returned. When `state`
    is None - because location wasn't available, or the caller just
    wants everything - every active alert is returned, matching the
    previous unfiltered behaviour."""
    _ensure_state_column()
    page = max(page, 1)
    offset = (page - 1) * PUBLIC_FEED_PAGE_SIZE
    state = state.strip() if state else None

    with get_db() as db:
        if state:
            rows = db.execute(
                """SELECT alert_id, title, message, severity, state, timestamp
                   FROM Public_Alerts
                   WHERE status = 'active' AND (state IS NULL OR state = ?)
                   ORDER BY timestamp DESC, alert_id DESC
                   LIMIT ? OFFSET ?""",
                (state, PUBLIC_FEED_PAGE_SIZE, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT alert_id, title, message, severity, state, timestamp
                   FROM Public_Alerts
                   WHERE status = 'active'
                   ORDER BY timestamp DESC, alert_id DESC
                   LIMIT ? OFFSET ?""",
                (PUBLIC_FEED_PAGE_SIZE, offset),
            ).fetchall()

    alerts = [dict(r) for r in rows]
    return {
        "page": page,
        "page_size": PUBLIC_FEED_PAGE_SIZE,
        "count": len(alerts),
        "state_filter": state,
        "alerts": alerts,
=======
    item = next((a for a in INITIAL_ALERTS if a.get("alert_id") == alert_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    fields = req.model_dump(exclude_none=True)
    item.update(fields)
    item["updated_at"] = datetime.now(timezone.utc).isoformat()
    return item


def get_public_feed(page: int = 1) -> dict:
    active_alerts = [a for a in INITIAL_ALERTS if a.get("status") == "active"]
    return {
        "page": page,
        "page_size": PUBLIC_FEED_PAGE_SIZE,
        "count": len(active_alerts),
        "alerts": active_alerts,
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5
    }


# ---------------------------------------------------------------------
# Public: translation toggle (Prompt 6, item 1)
# ---------------------------------------------------------------------
def translate_alerts(req: TranslateRequest) -> dict:
    """Translate each alert's title/message via Sarvam. English is a
    no-op passthrough. Failures are handled per-item, not for the whole
    batch: if Sarvam is unreachable or a single item fails, that item
    falls back to its original (untranslated) text rather than the
    frontend getting an empty/broken feed."""
    if req.language == "en":
        return {"items": [{"id": it.id, "title": it.title, "message": it.message} for it in req.items]}

    target_code = sarvam_client.LANGUAGE_CODE_MAP[req.language]

    results = []
    for item in req.items:
        try:
            translated_title = sarvam_client.translate_text(item.title, target_code)
            translated_message = sarvam_client.translate_text(item.message, target_code)
        except sarvam_client.SarvamAPIError:
            translated_title, translated_message = item.title, item.message
        results.append({"id": item.id, "title": translated_title, "message": translated_message})

    return {"items": results}


# ---------------------------------------------------------------------
# Public: per-card text-to-speech (Prompt 6, item 2)
# ---------------------------------------------------------------------
def get_audio_for_alert(req: TTSRequest) -> bytes:
    """Synthesize speech for one alert's text via Sarvam. Unlike
    translation, there's no sensible "fallback text" for audio, so a
    genuine failure here surfaces as a 502 and the frontend button shows
    its inline retry state, per the prompt."""
    target_code = sarvam_client.LANGUAGE_CODE_MAP.get(req.language, "en-IN")
    try:
        return sarvam_client.synthesize_speech(req.text, target_code)
    except sarvam_client.SarvamAPIError as exc:
        raise HTTPException(status_code=502, detail=f"Text-to-speech is temporarily unavailable: {exc}") from exc


# ---------------------------------------------------------------------
# Public: GPS -> state lookup for feed filtering (Prompt 6, item 3)
# ---------------------------------------------------------------------
def get_state_from_coordinates(req: StateLookupRequest) -> dict:
    """Resolve raw GPS coordinates to an Indian state name, or None if
    they don't fall inside any known state/UT (e.g. outside India)."""
    return {"state": lookup_state(req.lat, req.lng)}
