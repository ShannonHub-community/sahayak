"""
News Report Service API routes.

    Admin (News Report tab):
        POST   /api/news-report/alerts
        GET    /api/news-report/alerts
        GET    /api/news-report/alerts/{alert_id}
        PATCH  /api/news-report/alerts/{alert_id}

    Public (Citizen App "Live Updates" tab):
        GET    /api/comms/public-feed
"""
from fastapi import APIRouter, Query

from backend.services.news_report import service
from backend.services.news_report.schemas import (
    AlertCreateRequest,
    AlertOut,
    AlertUpdateRequest,
    PublicFeedResponse,
)

news_report_router = APIRouter(prefix="/api/news-report", tags=["news-report-admin"])
public_feed_router = APIRouter(prefix="/api/comms", tags=["comms-public"])


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
def get_public_feed(page: int = Query(default=1, ge=1)):
    return service.get_public_feed(page=page)
