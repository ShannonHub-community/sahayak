"""Pydantic models for the News Report service API surface."""
from typing import Optional
from pydantic import BaseModel, Field, field_validator

VALID_SEVERITIES = {"info", "advisory", "warning", "critical"}
VALID_STATUSES = {"active", "archived"}


# ---------- Admin: create/list alerts ----------
class AlertCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    severity: str = Field(default="info")
    created_by: Optional[str] = None

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
    timestamp: str
    updated_at: str


# ---------- Public: Live Updates feed ----------
class PublicAlertOut(BaseModel):
    """Public-facing shape - only the fields the Citizen App needs."""
    alert_id: int
    title: str
    message: str
    severity: str
    timestamp: str


class PublicFeedResponse(BaseModel):
    page: int
    page_size: int
    count: int
    alerts: list[PublicAlertOut]
