from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------- Sub-Tab 1

class DraftAlertRequest(BaseModel):
    zone_id: str


class DraftAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    zone_id: str
    message: str
    status: str
    created_at: datetime


class UpdateAlertDraftRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1600)  # ~ multi-part SMS ceiling


class BroadcastAlertRequest(BaseModel):
    draft_id: uuid.UUID


class BroadcastAlertResponse(BaseModel):
    id: uuid.UUID
    status: str
    sms_gateway_ref: str | None = None


# ---------------------------------------------------------------- Sub-Tab 2

class DraftPressRequest(BaseModel):
    template_id: str
    window_start: datetime
    window_end: datetime


class DraftPressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    template_id: str
    title: str
    body: str
    status: str
    created_at: datetime


class UpdatePressDraftRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    body: str | None = Field(default=None, min_length=1)


class PublishPressRequest(BaseModel):
    draft_id: uuid.UUID


class PublishPressResponse(BaseModel):
    id: uuid.UUID
    status: str
    press_portal_ref: str | None = None


# ---------------------------------------------------------------- Sub-Tab 3

class TimelineEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_event_id: str
    source_type: str
    event_type: str
    zone_id: str | None
    title: str
    body: str
    public_visible: bool
    event_at: datetime
    created_at: datetime


class ToggleVisibilityRequest(BaseModel):
    public_visible: bool


class TimelineFeedResponse(BaseModel):
    entries: list[TimelineEntryOut]
    generated_at: datetime
