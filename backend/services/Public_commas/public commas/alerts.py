"""
Sub-Tab 1 — SMS Alerts
=======================

Trigger: admin clicks a zone in the UI (zone_id known immediately, no async
event to wait on).

Flow:
  1. draft_alert(zone_id)      -> pull live Flood Engine/Twin data for the
                                   zone, ask the shared AI model for a draft
                                   SMS, persist as an editable draft, return it.
  2. update_alert_draft(...)   -> admin edits the AI draft before sending.
  3. broadcast_alert(draft_id) -> on the admin's "Broadcast" click, send the
                                   (possibly edited) message to the SMS
                                   Gateway, geofenced to that zone.

Every draft is persisted (`SmsAlertDraft`) so a broadcast is always
traceable back to exactly the zone snapshot and AI output that produced it.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .ai_client import AIClient, AIClientError, get_ai_client
from .external_clients import (
    DigitalTwinClient,
    ExternalServiceError,
    SMSGatewayClient,
)
from .models import SmsAlertDraft

logger = logging.getLogger("news_report.alerts")


class AlertDraftNotFound(RuntimeError):
    pass


class AlertNotDraftable(RuntimeError):
    """Raised if broadcast is attempted on a draft that's already sent/broadcasting."""


async def draft_alert(
    session: AsyncSession,
    zone_id: str,
    *,
    digital_twin: DigitalTwinClient | None = None,
    ai_client: AIClient | None = None,
) -> SmsAlertDraft:
    """
    Sub-Tab 1, step 1: called when the admin clicks a zone.

    Pulls the latest Flood Engine/Twin snapshot for the zone, asks the AI
    model for a drafted SMS, and persists+returns the draft for the admin
    to review/edit before broadcasting.
    """
    digital_twin = digital_twin or DigitalTwinClient()
    ai_client = ai_client or get_ai_client()

    zone_data = await digital_twin.get_zone_flood_data(zone_id)  # ExternalServiceError bubbles up

    try:
        drafted = await ai_client.draft_sms_alert(zone_id, zone_data)
    except AIClientError:
        logger.exception("news_report.alerts: AI drafting failed for zone_id=%s", zone_id)
        raise

    draft = SmsAlertDraft(
        zone_id=zone_id,
        zone_snapshot=zone_data,
        message=drafted.message,
        ai_model=ai_client.config.model,
        status="drafted",
    )
    session.add(draft)
    await session.commit()
    await session.refresh(draft)
    return draft


async def update_alert_draft(
    session: AsyncSession, draft_id: uuid.UUID, message: str
) -> SmsAlertDraft:
    """Admin edits the AI-drafted SMS text before broadcasting."""
    draft = await _get_draft(session, draft_id)
    if draft.status not in ("drafted", "failed"):
        raise AlertNotDraftable(f"Draft {draft_id} is in status={draft.status}, cannot edit")
    draft.message = message
    draft.status = "drafted"
    draft.error = None
    await session.commit()
    await session.refresh(draft)
    return draft


async def broadcast_alert(
    session: AsyncSession,
    draft_id: uuid.UUID,
    *,
    sms_gateway: SMSGatewayClient | None = None,
) -> SmsAlertDraft:
    """
    Sub-Tab 1, step 2: called on the admin's "Broadcast" click.

    Sends the current draft message to the SMS Gateway, geofenced to the
    draft's zone_id. Status transitions: drafted -> broadcasting ->
    broadcast | failed, so a retry never double-sends by accident (a draft
    already in `broadcasting`/`broadcast` is rejected, not re-sent).
    """
    sms_gateway = sms_gateway or SMSGatewayClient()

    draft = await _get_draft(session, draft_id)
    if draft.status not in ("drafted", "failed"):
        raise AlertNotDraftable(
            f"Draft {draft_id} is in status={draft.status}, refusing to broadcast again"
        )

    draft.status = "broadcasting"
    await session.commit()

    try:
        broadcast_ref = await sms_gateway.send_geofenced_broadcast(draft.zone_id, draft.message)
    except ExternalServiceError as exc:
        draft.status = "failed"
        draft.error = str(exc)
        await session.commit()
        logger.error("news_report.alerts: broadcast failed for draft_id=%s: %s", draft_id, exc)
        raise

    from datetime import datetime, timezone

    draft.status = "broadcast"
    draft.sms_gateway_ref = broadcast_ref
    draft.broadcast_at = datetime.now(timezone.utc)
    draft.error = None
    await session.commit()
    await session.refresh(draft)
    return draft


async def _get_draft(session: AsyncSession, draft_id: uuid.UUID) -> SmsAlertDraft:
    result = await session.execute(select(SmsAlertDraft).where(SmsAlertDraft.id == draft_id))
    draft = result.scalar_one_or_none()
    if draft is None:
        raise AlertDraftNotFound(f"No SMS alert draft with id={draft_id}")
    return draft
