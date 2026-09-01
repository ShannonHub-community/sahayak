"""
Sub-Tab 3 — Public Timeline
=============================

Trigger: this sub-tab is data-triggered, not UI-triggered. A background
listener (`run_timeline_listener`) subscribes to the audit trail / Twin
Aggregator event bus and processes each new event as it arrives — there is
no admin click that starts this flow.

Flow:
  1. run_timeline_listener()  -> long-running task (start it once at app
                                  startup) that consumes the event bus and
                                  calls handle_event() per message.
  2. handle_event(event)      -> AI-formats the raw event into a public-
                                  friendly headline+body, stores it with
                                  public_visible=True by default, and pushes
                                  it to connected Citizen Portal clients in
                                  real time.
  3. toggle_visibility(...)   -> called from the admin's visibility toggle
                                  UI action; flips public_visible and
                                  re-syncs the Citizen Portal feed so only
                                  currently-visible entries are shown.
  4. get_visible_feed(...)    -> read path used both for the resync push and
                                  for the Citizen Portal's normal feed load.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .ai_client import AIClient, AIClientError, get_ai_client
from .db import get_session_factory
from .external_clients import AuditTrailEventBus, CitizenPortalFeed, citizen_portal_feed
from .models import NewsTimelineEntry

logger = logging.getLogger("news_report.timeline")


class TimelineEntryNotFound(RuntimeError):
    pass


def _entry_payload(entry: NewsTimelineEntry) -> dict[str, Any]:
    return {
        "id": str(entry.id),
        "source_event_id": entry.source_event_id,
        "source_type": entry.source_type,
        "event_type": entry.event_type,
        "zone_id": entry.zone_id,
        "title": entry.title,
        "body": entry.body,
        "public_visible": entry.public_visible,
        "event_at": entry.event_at.isoformat(),
        "created_at": entry.created_at.isoformat(),
    }


async def handle_event(
    session: AsyncSession,
    event: dict[str, Any],
    *,
    ai_client: AIClient | None = None,
    feed: CitizenPortalFeed | None = None,
) -> NewsTimelineEntry | None:
    """
    Processes one raw audit-trail / Twin Aggregator event: AI-formats it,
    stores it (public_visible=True by default), and pushes it live to the
    Citizen Portal. Returns None (and logs) if the event is malformed or
    already processed, rather than raising and killing the listener loop.
    """
    ai_client = ai_client or get_ai_client()
    feed = feed or citizen_portal_feed

    source_event_id = event.get("id") or event.get("event_id")
    source_type = event.get("source") or event.get("source_type", "audit_trail")
    event_type = event.get("event_type") or event.get("type", "unknown")
    zone_id = event.get("zone_id")
    event_at_raw = event.get("timestamp") or event.get("event_at")

    if not source_event_id:
        logger.error("news_report.timeline: dropping event with no id: %s", event)
        return None

    event_at = _parse_timestamp(event_at_raw) or datetime.now(timezone.utc)

    try:
        formatted = await ai_client.format_timeline_entry(event)
    except AIClientError:
        logger.exception(
            "news_report.timeline: AI formatting failed for source_event_id=%s", source_event_id
        )
        return None

    entry = NewsTimelineEntry(
        source_event_id=str(source_event_id),
        source_type=str(source_type),
        event_type=str(event_type),
        zone_id=str(zone_id) if zone_id is not None else None,
        raw_payload=event,
        title=formatted.title,
        body=formatted.body,
        ai_model=ai_client.config.model,
        public_visible=True,  # default: auto-published, admin can hide later
        event_at=event_at,
    )
    session.add(entry)
    try:
        await session.commit()
    except IntegrityError:
        # source_event_id is unique -> this event was already processed
        # (e.g. redelivered by the bus). Not an error, just a no-op.
        await session.rollback()
        logger.info(
            "news_report.timeline: source_event_id=%s already processed, skipping", source_event_id
        )
        return None

    await session.refresh(entry)
    await feed.push_entry(_entry_payload(entry))
    return entry


def _parse_timestamp(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    try:
        parsed = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        logger.warning("news_report.timeline: unparseable event timestamp: %r", raw)
        return None


async def toggle_visibility(
    session: AsyncSession,
    entry_id: uuid.UUID,
    public_visible: bool,
    *,
    feed: CitizenPortalFeed | None = None,
) -> NewsTimelineEntry:
    """
    Called when the admin toggles an entry's visibility. Updates the flag
    and re-syncs the Citizen Portal's New Report tab feed so it reflects
    exactly the current set of visible entries.
    """
    feed = feed or citizen_portal_feed

    result = await session.execute(select(NewsTimelineEntry).where(NewsTimelineEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise TimelineEntryNotFound(f"No timeline entry with id={entry_id}")

    entry.public_visible = public_visible
    await session.commit()
    await session.refresh(entry)

    visible_entries = await get_visible_feed(session)
    await feed.push_resync([_entry_payload(e) for e in visible_entries])

    return entry


async def get_visible_feed(
    session: AsyncSession, *, limit: int = 200
) -> list[NewsTimelineEntry]:
    """Read path for the Citizen Portal's New Report tab: visible entries only."""
    result = await session.execute(
        select(NewsTimelineEntry)
        .where(NewsTimelineEntry.public_visible.is_(True))
        .order_by(NewsTimelineEntry.event_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------- background task

async def run_timeline_listener(
    *,
    event_bus: AuditTrailEventBus | None = None,
    ai_client: AIClient | None = None,
    feed: CitizenPortalFeed | None = None,
) -> None:
    """
    Long-running consumer of the audit trail / Twin Aggregator event bus.
    Start once at application startup, e.g.:

        @app.on_event("startup")
        async def _start_news_timeline_listener():
            asyncio.create_task(run_timeline_listener())

    Each event gets its own DB session so one slow/failed event can't hold
    a transaction open indefinitely; a per-event exception is logged and
    the loop keeps consuming (a single bad event must never take the whole
    public timeline offline).
    """
    event_bus = event_bus or AuditTrailEventBus()
    session_factory = get_session_factory()

    logger.info("news_report.timeline: listener starting")
    async for event in event_bus.subscribe():
        try:
            async with session_factory() as session:
                await handle_event(session, event, ai_client=ai_client, feed=feed)
        except Exception:  # noqa: BLE001 - must never kill the listener loop
            logger.exception(
                "news_report.timeline: unhandled error processing event id=%s",
                event.get("id") or event.get("event_id"),
            )
