"""
News Report & Public Communications Service - business logic & mock datasets.

Admin side (News Report tab):
    create_alert / list_alerts / get_alert / update_alert
    -> create, list, get, and update/archive alerts stored in the
       in-memory INITIAL_ALERTS list. NOTE: there is no persistent DB
       backing this yet - state resets on every process restart, same
       as the metrics/zones/press/timeline mock data below.

Public side (Citizen App "Live Updates" tab):
    get_public_feed
    -> pulls active alerts, newest-first, optionally filtered to a
       single Indian state. Nationwide alerts (state=None) are always
       included alongside a state match.
    translate_alerts / get_audio_for_alert / get_state_from_coordinates
    -> backend halves of the three Live Updates additions from Prompt 6:
       translation toggle, per-card text-to-speech, and GPS-based state
       filtering. The actual Sarvam API calls live in sarvam_client;
       this module just wires requests to it and fails gracefully.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from fastapi import HTTPException

from . import cloud_tts_fallback
from services.news_report.geo_lookup import lookup_state
from services.news_report.schemas import (
    AlertCreateRequest,
    AlertUpdateRequest,
    StateLookupRequest,
    TranslateRequest,
    TTSRequest,
)
from database.local_sqlite import get_db_session, NewsAlert, init_db

PUBLIC_FEED_PAGE_SIZE = 20
_state_column_ensured = True

# In-memory storage for active alerts (no DB yet - resets on restart).
INITIAL_ALERTS: List[Dict[str, Any]] = [
    {
        "alert_id": 1,
        "title": "RED ALERT: Morbe Dam Secondary Spillway Gate 2 Opening",
        "message": "Water levels at Morbe Reservoir have exceeded 88.4m FSL. Controlled discharge of 4,800 cusecs commenced into Patalganga basin. All riverine communities must evacuate to designated relief camps immediately.",
        "severity": "critical",
        "status": "active",
        "created_by": "State Disaster Management Authority / CWC",
        "state": "Maharashtra",
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
        "state": "Maharashtra",
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
        "state": "Maharashtra",
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
        "state": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 5,
        "title": "DAM SLUICE GATE DISCHARGE: Krishna River Basin Spillways",
        "message": "Due to continuous heavy catchment rainfall, 4 spillway gates at Almatti and Narayanpur dams have been opened discharging 1,45,000 cusecs. Residents along low-lying riverbanks must move to designated higher ground shelters immediately.",
        "severity": "critical",
        "status": "active",
        "created_by": "Central Water Commission & Karnataka SDRF",
        "state": "Karnataka",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 6,
        "title": "FLOOD WARNING: Yamuna River Exceeds Evacuation Mark",
        "message": "Water levels at Old Railway Bridge have risen past 206.0m due to heavy discharge from Hathnikund Barrage. Inhabitants of low-lying floodplains in East and North East Delhi must relocate to designated community relief tents immediately.",
        "severity": "warning",
        "status": "active",
        "created_by": "Delhi Disaster Management Authority (DDMA)",
        "state": "Delhi",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 7,
        "title": "COASTAL INUNDATION ADVISORY: Heavy Rain & Sea Surge Warning",
        "message": "IMD Chennai issues Orange Alert warning of isolated heavy to very heavy rainfall over coastal districts. Emergency relief shelters operational across Greater Chennai Corporation and Cuddalore riverine areas.",
        "severity": "warning",
        "status": "active",
        "created_by": "Tamil Nadu State Disaster Management Authority (TNSDMA)",
        "state": "Tamil Nadu",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 8,
        "title": "TIDAL SURGE ALERT: Sundarbans Coastal Embankment Vigilance",
        "message": "High spring tides combined with deep depression in the Bay of Bengal. Civil defence volunteers deployed along vulnerable earthen river embankments in Kakdwip, Gosaba, and Sagar Island. Fishermen advised not to venture into deep sea.",
        "severity": "info",
        "status": "active",
        "created_by": "West Bengal Department of Disaster Management",
        "state": "West Bengal",
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


# ---------------------------------------------------------------------
# Admin: create / list / get / update alerts
# ---------------------------------------------------------------------
def create_alert(req: AlertCreateRequest) -> dict:
    with get_db_session() as session:
        now_str = datetime.now(timezone.utc).isoformat()
        alert = NewsAlert(
            title=req.title.strip(),
            message=req.message.strip(),
            severity=req.severity,
            status="active",
            created_by=req.created_by,
            state=req.state.strip() if getattr(req, "state", None) else None,
            timestamp=now_str,
            updated_at=now_str,
        )
        session.add(alert)
        session.commit()
        session.refresh(alert)
        record = alert.to_dict()
        # Keep in-memory cache in sync if accessed elsewhere
        INITIAL_ALERTS.insert(0, record)
        return record


def list_alerts(status: Optional[str] = None, page: int = 1, page_size: int = 20) -> list[dict]:
    with get_db_session() as session:
        query = session.query(NewsAlert)
        if status:
            query = query.filter(NewsAlert.status == status)
        query = query.order_by(NewsAlert.alert_id.desc())
        if page and page_size:
            query = query.offset((page - 1) * page_size).limit(page_size)
        alerts = query.all()
        return [a.to_dict() for a in alerts]


def get_alert(alert_id: int) -> dict:
    with get_db_session() as session:
        alert = session.query(NewsAlert).filter(NewsAlert.alert_id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        return alert.to_dict()


def update_alert(alert_id: int, req: AlertUpdateRequest) -> dict:
    with get_db_session() as session:
        alert = session.query(NewsAlert).filter(NewsAlert.alert_id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        fields = req.model_dump(exclude_none=True)
        if not fields:
            raise HTTPException(status_code=422, detail="No fields to update")

        # Allow explicitly clearing state back to nationwide with "".
        if "state" in fields and fields["state"] == "":
            fields["state"] = None

        for key, value in fields.items():
            setattr(alert, key, value)

        alert.updated_at = datetime.now(timezone.utc).isoformat()
        session.commit()
        session.refresh(alert)
        record = alert.to_dict()
        # Update in-memory item if present
        for i, item in enumerate(INITIAL_ALERTS):
            if item.get("alert_id") == alert_id:
                INITIAL_ALERTS[i] = record
                break
        return record


# ---------------------------------------------------------------------
# Public: Live Updates feed
# ---------------------------------------------------------------------
def get_public_feed(page: int = 1, state: Optional[str] = None) -> dict:
    """Triggered by the user loading the "Live Updates" tab. Pulls active
    alerts, newest first, optionally filtered to a single Indian state -
    nationwide alerts (state=None) always included alongside a state
    match. When `state` is None (no GPS/location available), every
    active alert is returned, matching the original unfiltered
    behaviour."""
    state = state.strip() if state else None

    with get_db_session() as session:
        from sqlalchemy import or_
        query = session.query(NewsAlert).filter(NewsAlert.status == "active")
        if state:
            query = query.filter(or_(NewsAlert.state.is_(None), NewsAlert.state == state))

        query = query.order_by(NewsAlert.alert_id.desc())
        alerts = query.all()
        active_alerts = [a.to_dict() for a in alerts]

        return {
            "page": page,
            "page_size": PUBLIC_FEED_PAGE_SIZE,
            "count": len(active_alerts),
            "state_filter": state,
            "alerts": active_alerts,
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

    target_code = cloud_tts_fallback.LANGUAGE_CODE_MAP[req.language]

    results = []
    for item in req.items:
        try:
            translated_title = cloud_tts_fallback.translate_text(item.title, target_code)
            translated_message = cloud_tts_fallback.translate_text(item.message, target_code)
        except cloud_tts_fallback.CloudCommsAPIError:
            translated_title, translated_message = item.title, item.message
        results.append({"id": item.id, "title": translated_title, "message": translated_message})

    return {"items": results}


# ---------------------------------------------------------------------
# Public: per-card text-to-speech (Prompt 6, item 2)
# ---------------------------------------------------------------------
def get_audio_for_alert(req: TTSRequest) -> bytes:
    """Synthesize speech for one alert's text via cloud TTS fallback. Unlike
    translation, there's no sensible "fallback text" for audio, so a
    genuine failure here surfaces as a 502 and the frontend button shows
    its inline retry state, per the prompt."""
    target_code = cloud_tts_fallback.LANGUAGE_CODE_MAP.get(req.language, "en-IN")
    try:
        return cloud_tts_fallback.synthesize_speech(req.text, target_code)
    except cloud_tts_fallback.CloudCommsAPIError as exc:
        raise HTTPException(status_code=502, detail=f"Text-to-speech is temporarily unavailable: {exc}") from exc


# ---------------------------------------------------------------------
# Public: GPS -> state lookup for feed filtering (Prompt 6, item 3)
# ---------------------------------------------------------------------
def get_state_from_coordinates(req: StateLookupRequest) -> dict:
    """Resolve raw GPS coordinates to an Indian state name, or None if
    they don't fall inside any known state/UT (e.g. outside India)."""
    return {"state": lookup_state(req.lat, req.lng)}
