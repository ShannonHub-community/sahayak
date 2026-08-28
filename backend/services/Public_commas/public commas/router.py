"""
FastAPI wiring for news_report.

Mount into the host app with:

    from backend.services.news_report.router import router as news_report_router
    app.include_router(news_report_router)

    # once, at app startup:
    import asyncio
    from backend.services.news_report.timeline import run_timeline_listener

    @app.on_event("startup")
    async def _start_news_report_listener():
        asyncio.create_task(run_timeline_listener())
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from . import alerts, press, timeline
from .db import get_session
from .external_clients import ExternalServiceError, citizen_portal_feed
from .schemas import (
    BroadcastAlertRequest,
    BroadcastAlertResponse,
    DraftAlertRequest,
    DraftAlertResponse,
    DraftPressRequest,
    DraftPressResponse,
    PublishPressRequest,
    PublishPressResponse,
    TimelineEntryOut,
    TimelineFeedResponse,
    ToggleVisibilityRequest,
    UpdateAlertDraftRequest,
    UpdatePressDraftRequest,
)

logger = logging.getLogger("news_report.router")

router = APIRouter(prefix="/news-report", tags=["news-report"])


# ---------------------------------------------------------------- Sub-Tab 1

@router.post("/alerts/draft", response_model=DraftAlertResponse)
async def post_draft_alert(
    body: DraftAlertRequest, session: AsyncSession = Depends(get_session)
):
    """Admin clicks a zone -> draft an SMS alert from live Flood Engine/Twin data."""
    try:
        draft = await alerts.draft_alert(session, body.zone_id)
    except ExternalServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # AIClientError etc.
        raise HTTPException(status_code=502, detail=f"Alert drafting failed: {exc}") from exc
    return draft


@router.patch("/alerts/{draft_id}", response_model=DraftAlertResponse)
async def patch_alert_draft(
    draft_id: uuid.UUID, body: UpdateAlertDraftRequest, session: AsyncSession = Depends(get_session)
):
    """Admin edits the AI-drafted SMS text before broadcasting."""
    try:
        return await alerts.update_alert_draft(session, draft_id, body.message)
    except alerts.AlertDraftNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except alerts.AlertNotDraftable as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/alerts/broadcast", response_model=BroadcastAlertResponse)
async def post_broadcast_alert(
    body: BroadcastAlertRequest, session: AsyncSession = Depends(get_session)
):
    """Admin clicks "Broadcast" -> send the (possibly edited) SMS to the geofence."""
    try:
        draft = await alerts.broadcast_alert(session, body.draft_id)
    except alerts.AlertDraftNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except alerts.AlertNotDraftable as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ExternalServiceError as exc:
        raise HTTPException(status_code=502, detail=f"SMS Gateway error: {exc}") from exc
    return BroadcastAlertResponse(
        id=draft.id, status=draft.status, sms_gateway_ref=draft.sms_gateway_ref
    )


# ---------------------------------------------------------------- Sub-Tab 2

@router.post("/press/draft", response_model=DraftPressResponse)
async def post_draft_press(
    body: DraftPressRequest, session: AsyncSession = Depends(get_session)
):
    """Admin selects a template -> draft a press release from audit trail data."""
    try:
        draft = await press.draft_press_release(
            session, body.template_id, body.window_start, body.window_end
        )
    except press.TemplateNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ExternalServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # AIClientError etc.
        raise HTTPException(status_code=502, detail=f"Press drafting failed: {exc}") from exc
    return draft


@router.patch("/press/{draft_id}", response_model=DraftPressResponse)
async def patch_press_draft(
    draft_id: uuid.UUID, body: UpdatePressDraftRequest, session: AsyncSession = Depends(get_session)
):
    """Admin edits the AI-drafted title/body before publishing."""
    try:
        return await press.update_press_draft(
            session, draft_id, title=body.title, body=body.body
        )
    except press.PressDraftNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except press.PressNotDraftable as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/press/publish", response_model=PublishPressResponse)
async def post_publish_press(
    body: PublishPressRequest, session: AsyncSession = Depends(get_session)
):
    """Admin clicks "Publish" -> send the (possibly edited) release to the Press Portal."""
    try:
        draft = await press.publish_press_release(session, body.draft_id)
    except press.PressDraftNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except press.PressNotDraftable as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ExternalServiceError as exc:
        raise HTTPException(status_code=502, detail=f"Press Portal error: {exc}") from exc
    return PublishPressResponse(
        id=draft.id, status=draft.status, press_portal_ref=draft.press_portal_ref
    )


# ---------------------------------------------------------------- Sub-Tab 3

@router.get("/timeline/feed", response_model=TimelineFeedResponse)
async def get_timeline_feed(session: AsyncSession = Depends(get_session)):
    """
    Citizen Portal's New Report tab initial load / manual refresh.
    (Live updates arrive over the /timeline/ws websocket below.)
    """
    from datetime import datetime, timezone

    entries = await timeline.get_visible_feed(session)
    return TimelineFeedResponse(entries=entries, generated_at=datetime.now(timezone.utc))


@router.patch("/timeline/{entry_id}/visibility", response_model=TimelineEntryOut)
async def patch_timeline_visibility(
    entry_id: uuid.UUID, body: ToggleVisibilityRequest, session: AsyncSession = Depends(get_session)
):
    """
    Admin toggles an entry's visibility. Updates public_visible and
    re-syncs every connected Citizen Portal client's feed.
    """
    try:
        return await timeline.toggle_visibility(session, entry_id, body.public_visible)
    except timeline.TimelineEntryNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.websocket("/timeline/ws")
async def timeline_websocket(websocket: WebSocket):
    """
    Real-time push channel for the Citizen Portal's New Report tab: new
    visible entries and full resyncs (after a visibility toggle) are pushed
    here as they happen.
    """
    await websocket.accept()
    citizen_portal_feed.register_client(websocket)
    try:
        while True:
            # We don't expect inbound messages; this just keeps the
            # connection open and detects disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        citizen_portal_feed.unregister_client(websocket)
