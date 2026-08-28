"""
Sub-Tab 2 — Press Releases
============================

Trigger: admin selects a template in the UI (template_id known immediately).

Flow:
  1. draft_press_release(template_id, window_start, window_end)
       -> load the template, pull relevant audit trail data for the time
          window (e.g. Workforce rescue logs), ask the shared AI model to
          draft a press release from template + data, persist as an
          editable draft, return it.
  2. update_press_draft(...)   -> admin edits title/body before publishing.
  3. publish_press_release(draft_id) -> on the admin's "Publish" click, send
          the (possibly edited) release to the external Press Portal.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .ai_client import AIClient, AIClientError, get_ai_client
from .external_clients import AuditTrailClient, ExternalServiceError, PressPortalClient
from .models import PressReleaseDraft

logger = logging.getLogger("news_report.press")


class PressDraftNotFound(RuntimeError):
    pass


class PressNotDraftable(RuntimeError):
    """Raised if publish is attempted on a draft that's already publishing/published."""


class TemplateNotFound(RuntimeError):
    pass


# In a real deployment this would be a DB table / template-management
# service. Kept as a lightweight lookup here so press.py has a single,
# obvious integration point (`_load_template`) to swap out.
async def _load_template(template_id: str) -> dict:
    from .templates import get_template  # local import avoids a hard dependency at module load

    template = await get_template(template_id)
    if template is None:
        raise TemplateNotFound(f"No press template with id={template_id}")
    return template


async def draft_press_release(
    session: AsyncSession,
    template_id: str,
    window_start: datetime,
    window_end: datetime,
    *,
    event_types: list[str] | None = None,
    audit_trail: AuditTrailClient | None = None,
    ai_client: AIClient | None = None,
) -> PressReleaseDraft:
    """
    Sub-Tab 2, step 1: called when the admin selects a template (and,
    implicitly, a reporting window - default to "since last press release"
    or an explicit range chosen in the UI).
    """
    audit_trail = audit_trail or AuditTrailClient()
    ai_client = ai_client or get_ai_client()

    template = await _load_template(template_id)
    audit_data = await audit_trail.get_events_in_window(
        start=window_start, end=window_end, event_types=event_types
    )

    try:
        drafted = await ai_client.draft_press_release(template_id, template, audit_data)
    except AIClientError:
        logger.exception("news_report.press: AI drafting failed for template_id=%s", template_id)
        raise

    draft = PressReleaseDraft(
        template_id=template_id,
        window_start=window_start,
        window_end=window_end,
        audit_snapshot={"events": audit_data},
        title=drafted.title,
        body=drafted.body,
        ai_model=ai_client.config.model,
        status="drafted",
    )
    session.add(draft)
    await session.commit()
    await session.refresh(draft)
    return draft


async def update_press_draft(
    session: AsyncSession,
    draft_id: uuid.UUID,
    *,
    title: str | None = None,
    body: str | None = None,
) -> PressReleaseDraft:
    """Admin edits the AI-drafted title/body before publishing."""
    draft = await _get_draft(session, draft_id)
    if draft.status not in ("drafted", "failed"):
        raise PressNotDraftable(f"Draft {draft_id} is in status={draft.status}, cannot edit")
    if title is not None:
        draft.title = title
    if body is not None:
        draft.body = body
    draft.status = "drafted"
    draft.error = None
    await session.commit()
    await session.refresh(draft)
    return draft


async def publish_press_release(
    session: AsyncSession,
    draft_id: uuid.UUID,
    *,
    press_portal: PressPortalClient | None = None,
) -> PressReleaseDraft:
    """
    Sub-Tab 2, step 2: called on the admin's "Publish" click.

    Status transitions: drafted -> publishing -> published | failed, so a
    retry never double-publishes (a draft already publishing/published is
    rejected outright).
    """
    press_portal = press_portal or PressPortalClient()

    draft = await _get_draft(session, draft_id)
    if draft.status not in ("drafted", "failed"):
        raise PressNotDraftable(
            f"Draft {draft_id} is in status={draft.status}, refusing to publish again"
        )

    draft.status = "publishing"
    await session.commit()

    try:
        release_ref = await press_portal.publish(draft.title, draft.body)
    except ExternalServiceError as exc:
        draft.status = "failed"
        draft.error = str(exc)
        await session.commit()
        logger.error("news_report.press: publish failed for draft_id=%s: %s", draft_id, exc)
        raise

    from datetime import timezone

    draft.status = "published"
    draft.press_portal_ref = release_ref
    draft.published_at = datetime.now(timezone.utc)
    draft.error = None
    await session.commit()
    await session.refresh(draft)
    return draft


async def _get_draft(session: AsyncSession, draft_id: uuid.UUID) -> PressReleaseDraft:
    result = await session.execute(select(PressReleaseDraft).where(PressReleaseDraft.id == draft_id))
    draft = result.scalar_one_or_none()
    if draft is None:
        raise PressDraftNotFound(f"No press release draft with id={draft_id}")
    return draft
