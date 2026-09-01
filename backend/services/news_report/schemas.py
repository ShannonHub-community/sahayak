"""Pydantic models for the News Report service API surface."""
from typing import Optional
from pydantic import BaseModel, Field, field_validator

VALID_SEVERITIES = {"info", "advisory", "warning", "critical"}
VALID_STATUSES = {"active", "archived"}

# Matches the language picker in the Live Updates feed (Prompt 6, item 1).
SUPPORTED_LANGUAGES = {"en", "hi", "mr", "bn", "gu", "kn", "ml", "or", "pa", "ta", "te"}


def _validate_language(v: str) -> str:
    v = (v or "").strip().lower()
    if v not in SUPPORTED_LANGUAGES:
        raise ValueError(f"language must be one of {sorted(SUPPORTED_LANGUAGES)}")
    return v


# ---------- Admin: create/list alerts ----------
class AlertCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    severity: str = Field(default="info")
    created_by: Optional[str] = None
    state: Optional[str] = Field(
        default=None,
        description="Indian state this alert applies to, e.g. 'Maharashtra'. "
        "Leave unset for a nationwide alert shown to everyone.",
    )

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_SEVERITIES:
            raise ValueError(f"severity must be one of {sorted(VALID_SEVERITIES)}")
        return v


class AlertUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    message: Optional[str] = Field(default=None, min_length=1)
    severity: Optional[str] = None
    status: Optional[str] = None
    state: Optional[str] = Field(
        default=None,
        description="Indian state this alert applies to. Set to an empty "
        "string to clear it back to nationwide.",
    )

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if v not in VALID_SEVERITIES:
            raise ValueError(f"severity must be one of {sorted(VALID_SEVERITIES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {sorted(VALID_STATUSES)}")
        return v


class AlertOut(BaseModel):
    alert_id: int
    title: str
    message: str
    severity: str
    status: str
    created_by: Optional[str] = None
    state: Optional[str] = None
    timestamp: str
    updated_at: str


# ---------- Public: Live Updates feed ----------
class PublicAlertOut(BaseModel):
    """Public-facing shape - only the fields the Citizen App needs."""
    alert_id: int
    title: str
    message: str
    severity: str
    state: Optional[str] = None
    timestamp: str


class PublicFeedResponse(BaseModel):
    page: int
    page_size: int
    count: int
    # Echoes back the state the feed was filtered to, so the frontend
    # knows whether its location-based filter (Prompt 6, item 3) was
    # actually applied or whether this is the unfiltered nationwide feed.
    state_filter: Optional[str] = None
    alerts: list[PublicAlertOut]


# ---------- Public: translation toggle (item 1) ----------
class TranslateItem(BaseModel):
    id: str
    title: str
    message: str


class TranslateRequest(BaseModel):
    language: str
    items: list[TranslateItem] = Field(..., min_length=1, max_length=100)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        return _validate_language(v)


class TranslateResponseItem(BaseModel):
    id: str
    title: str
    message: str


class TranslateResponse(BaseModel):
    items: list[TranslateResponseItem]


# ---------- Public: text-to-speech toggle (item 2) ----------
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en")

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        return _validate_language(v or "en")


# ---------- Public: GPS -> state lookup (item 3) ----------
class StateLookupRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class StateLookupResponse(BaseModel):
    state: Optional[str] = None
