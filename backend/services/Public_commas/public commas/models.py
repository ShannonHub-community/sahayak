from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SmsAlertDraft(Base):
    """
    A drafted-but-not-yet-broadcast SMS alert (Sub-Tab 1).

    Kept as its own row (rather than only in-memory) so the admin can
    navigate away, come back, and still see/edit the draft before hitting
    Broadcast, and so every broadcast is traceable back to the zone data and
    AI draft that produced it.
    """

    __tablename__ = "sms_alert_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    zone_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    zone_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Flood Engine/Twin data used
    message: Mapped[str] = mapped_column(Text, nullable=False)  # AI-drafted, admin-editable
    ai_model: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="drafted")
    # drafted -> broadcasting -> broadcast | failed

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
    broadcast_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sms_gateway_ref: Mapped[str | None] = mapped_column(String(256), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class PressReleaseDraft(Base):
    """A drafted-but-not-yet-published press release (Sub-Tab 2)."""

    __tablename__ = "press_release_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    template_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    audit_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)  # audit trail data used
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    ai_model: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="drafted")
    # drafted -> publishing -> published | failed

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    press_portal_ref: Mapped[str | None] = mapped_column(String(256), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class NewsTimelineEntry(Base):
    """
    Public-facing timeline entry (Sub-Tab 3), one row per audit-trail /
    Twin Aggregator event, AI-formatted into plain-language text.

    `public_visible` defaults to True (auto-published) and can be flipped
    off by an admin; the Citizen Portal feed only ever reads rows where
    public_visible = True.
    """

    __tablename__ = "news_timeline"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)

    # De-dupe key: the id of the source audit-trail / Twin Aggregator event.
    source_event_id: Mapped[str] = mapped_column(String(256), nullable=False, unique=True, index=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g. "audit_trail", "twin_aggregator"
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)  # e.g. "workforce_rescue", "flood_zone_update"
    zone_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)

    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)  # untouched source event

    title: Mapped[str] = mapped_column(String(512), nullable=False)      # AI-formatted headline
    body: Mapped[str] = mapped_column(Text, nullable=False)              # AI-formatted public-friendly text
    ai_model: Mapped[str] = mapped_column(String(128), nullable=False)

    public_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    event_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)  # when it happened
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)  # when we recorded it
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
