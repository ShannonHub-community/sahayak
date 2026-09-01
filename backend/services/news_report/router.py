"""
<<<<<<< HEAD
News Report Service API routes.

    Admin (News Report tab):
        POST   /api/news-report/alerts
        GET    /api/news-report/alerts
        GET    /api/news-report/alerts/{alert_id}
        PATCH  /api/news-report/alerts/{alert_id}

    Public (Citizen App "Live Updates" tab):
        GET    /api/comms/public-feed          ?state=Maharashtra (optional)
        POST   /api/comms/translate            translation toggle (item 1)
        POST   /api/comms/tts                  per-card read-aloud (item 2)
        POST   /api/geo/state-lookup           GPS -> state (item 3)
"""
from fastapi import APIRouter, Query, Response
=======
News Report & Public Communications Service API routes.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5

from services.news_report import service
from services.news_report.schemas import (
    AlertCreateRequest,
    AlertOut,
    AlertUpdateRequest,
    PublicFeedResponse,
    StateLookupRequest,
    StateLookupResponse,
    TranslateRequest,
    TranslateResponse,
    TTSRequest,
)

<<<<<<< HEAD
news_report_router = APIRouter(prefix="/api/news-report", tags=["news-report-admin"])
public_feed_router = APIRouter(prefix="/api/comms", tags=["comms-public"])
geo_router = APIRouter(prefix="/api/geo", tags=["geo-public"])
=======
news_report_router = APIRouter(tags=["news-report-admin"])
public_feed_router = APIRouter(tags=["comms-public"])


# ---------------------------------------------------------------------
# Public: Live Updates feed & Alerts
# ---------------------------------------------------------------------
@public_feed_router.get("/api/comms/public-feed", response_model=PublicFeedResponse)
@public_feed_router.get("/api/v1/comms/public-feed", response_model=PublicFeedResponse)
@public_feed_router.get("/api/v1/comms/alerts")
def get_public_feed(page: int = Query(default=1, ge=1)):
    return service.get_public_feed(page=page)
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5


# ---------------------------------------------------------------------
# Admin: create / list / get / update alerts
# ---------------------------------------------------------------------
@news_report_router.post("/api/news-report/alerts", response_model=AlertOut)
@news_report_router.post("/api/news_report/alerts", response_model=AlertOut)
@news_report_router.post("/api/v1/comms/alerts", response_model=AlertOut)
def create_alert(req: AlertCreateRequest):
    return service.create_alert(req)


@news_report_router.get("/api/news-report/alerts", response_model=list[AlertOut])
@news_report_router.get("/api/news_report/alerts", response_model=list[AlertOut])
def list_alerts(
    status: Optional[str] = Query(default=None, description="Filter by status: active | archived"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return service.list_alerts(status=status, page=page, page_size=page_size)


@news_report_router.get("/api/news-report/alerts/{alert_id}", response_model=AlertOut)
@news_report_router.get("/api/news_report/alerts/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int):
    return service.get_alert(alert_id)


@news_report_router.patch("/api/news-report/alerts/{alert_id}", response_model=AlertOut)
@news_report_router.patch("/api/news_report/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, req: AlertUpdateRequest):
    return service.update_alert(alert_id, req)


# ---------------------------------------------------------------------
# Public Comms Module Endpoints (Metrics, Zones, Press, Timeline)
# ---------------------------------------------------------------------
<<<<<<< HEAD
@public_feed_router.get("/public-feed", response_model=PublicFeedResponse)
def get_public_feed(
    page: int = Query(default=1, ge=1),
    state: str | None = Query(
        default=None,
        description="Indian state to filter alerts to, e.g. 'Maharashtra'. "
        "Omit to get the unfiltered nationwide feed.",
    ),
):
    return service.get_public_feed(page=page, state=state)


# ---------------------------------------------------------------------
# Public: translation toggle (item 1)
# ---------------------------------------------------------------------
@public_feed_router.post("/translate", response_model=TranslateResponse)
def translate_alerts(req: TranslateRequest):
    return service.translate_alerts(req)


# ---------------------------------------------------------------------
# Public: per-card text-to-speech (item 2)
# ---------------------------------------------------------------------
@public_feed_router.post("/tts")
def get_alert_audio(req: TTSRequest):
    audio_bytes = service.get_audio_for_alert(req)
    return Response(content=audio_bytes, media_type="audio/wav")


# ---------------------------------------------------------------------
# Public: GPS -> state lookup for feed filtering (item 3)
# ---------------------------------------------------------------------
@geo_router.post("/state-lookup", response_model=StateLookupResponse)
def state_lookup(req: StateLookupRequest):
    return service.get_state_from_coordinates(req)
=======
@news_report_router.get("/api/news_report/metrics")
@news_report_router.get("/api/news-report/metrics")
@news_report_router.get("/api/v1/comms/metrics")
def get_metrics():
    return service.MOCK_METRICS


@news_report_router.get("/api/news_report/zones")
@news_report_router.get("/api/news-report/zones")
@news_report_router.get("/api/v1/comms/zones")
def get_zones():
    return service.MOCK_ZONES


@news_report_router.post("/api/news_report/alerts/draft")
@news_report_router.post("/api/news-report/alerts/draft")
def generate_ai_draft_sms(payload: Dict[str, Any]):
    zone_id = payload.get("zone_id", "zone-01")
    zone = next((z for z in service.MOCK_ZONES if z["zone_id"] == zone_id), service.MOCK_ZONES[0])
    draft = f"EMERGENCY BROADCAST (NDMA/GOI): {zone['zone_name']} is under {zone['evacuation_status']} Evacuation due to {zone['flood_depth_m']}m flood depth. Move to designated high-ground shelters immediately. Call 112 for emergency rescue."
    return {"draft": draft}


@news_report_router.get("/api/news_report/press/templates")
@news_report_router.get("/api/news-report/press/templates")
def get_press_templates():
    return service.MOCK_PRESS_TEMPLATES


@news_report_router.post("/api/news_report/press/draft")
@news_report_router.post("/api/news-report/press/draft")
def generate_ai_press_release(payload: Dict[str, Any]):
    tmpl_id = payload.get("template_id", "tmpl-01")
    tmpl = next((t for t in service.MOCK_PRESS_TEMPLATES if t["id"] == tmpl_id), service.MOCK_PRESS_TEMPLATES[0])
    content = (
        f"[OFFICIAL PRESS RELEASE - {tmpl['name'].upper()}]\n"
        f"For Immediate Release\n"
        f"Issued by: NDMA / State Emergency Operations Center (EOC)\n"
        f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n"
        f"EXECUTIVE DISASTER ADVISORY\n"
        f"In light of persistent heavy rainfall in Raigad district, emergency multi-agency response teams (NDRF Unit 5, SDRF, and Civil Defense) have been staged across vulnerable zones.\n\n"
        f"KEY SITUATION UPDATES\n"
        f"- Morbe Dam water discharge rate currently regulated.\n"
        f"- Evacuation shelters operational in Panvel, Roha, and Pen with hot meals, clean drinking water, and trauma medical personnel.\n"
        f"- High-clearance ambulances stationed along NH-66.\n\n"
        f"PUBLIC HELPLINE\n"
        f"Citizens in distress should dial 112 or use the SAHAYAK Citizen SOS portal for immediate GPS-based evacuation dispatch.\n\n"
        f"--- END OF BROADCAST ---"
    )
    return {"content": content}


@news_report_router.post("/api/news_report/press")
@news_report_router.post("/api/news-report/press")
def publish_press_release(payload: Dict[str, Any]):
    new_release = {
        "id": f"pr-{len(service.MOCK_PRESS_RELEASES) + 1:02d}",
        "template_id": payload.get("template_id", "tmpl-01"),
        "content": payload.get("content", ""),
        "published_by": payload.get("published_by", "EOC Information Officer"),
        "published_at": datetime.now(timezone.utc).isoformat(),
    }
    service.MOCK_PRESS_RELEASES.insert(0, new_release)
    return new_release


@news_report_router.get("/api/news_report/timeline")
@news_report_router.get("/api/news-report/timeline")
def get_timeline():
    return service.MOCK_TIMELINE_ENTRIES


@news_report_router.patch("/api/news_report/timeline/{id}/visibility")
@news_report_router.patch("/api/news-report/timeline/{id}/visibility")
def toggle_timeline_visibility(id: str, payload: Dict[str, Any]):
    item = next((t for t in service.MOCK_TIMELINE_ENTRIES if t["id"] == id), None)
    if item:
        item["public_visible"] = payload.get("public_visible", True)
        return {"status": "success", "entry": item}
    return {"status": "success"}
>>>>>>> c6112fb113483eb8e726fc94e6947e47b88eadf5
