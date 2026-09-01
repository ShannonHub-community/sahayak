"""
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

from backend.services.news_report import service
from backend.services.news_report.schemas import (
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

news_report_router = APIRouter(prefix="/api/news-report", tags=["news-report-admin"])
public_feed_router = APIRouter(prefix="/api/comms", tags=["comms-public"])
geo_router = APIRouter(prefix="/api/geo", tags=["geo-public"])


# ---------------------------------------------------------------------
# Admin: create / list / get / update alerts
# ---------------------------------------------------------------------
@news_report_router.post("/alerts", response_model=AlertOut)
def create_alert(req: AlertCreateRequest):
    return service.create_alert(req)


@news_report_router.get("/alerts", response_model=list[AlertOut])
def list_alerts(
    status: str | None = Query(default=None, description="Filter by status: active | archived"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return service.list_alerts(status=status, page=page, page_size=page_size)


@news_report_router.get("/alerts/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int):
    return service.get_alert(alert_id)


@news_report_router.patch("/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, req: AlertUpdateRequest):
    return service.update_alert(alert_id, req)


# ---------------------------------------------------------------------
# Public: Live Updates feed
# ---------------------------------------------------------------------
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
