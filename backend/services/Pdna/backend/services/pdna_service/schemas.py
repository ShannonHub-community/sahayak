from typing import Optional

from pydantic import BaseModel, Field, field_validator

from .models import DamageCategory, ReportStatus, Severity


class PDNAReportOut(BaseModel):
    id: str
    tracking_id: str
    reporter_citizen_id: Optional[str] = None
    photo_url: str
    damage_category: str
    severity: str
    status: str
    latitude: float
    longitude: float
    assigned_workforce_id: Optional[str] = None
    created_at: str
    updated_at: str


class SubmitResponse(BaseModel):
    tracking_id: str
    status: str
    report: PDNAReportOut


class TrackResponse(BaseModel):
    tracking_id: str
    status: str
    damage_category: str
    severity: str
    created_at: str
    updated_at: str
    assigned_workforce_id: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: ReportStatus
    actor: Optional[str] = Field(default="admin")
    team_type: Optional[str] = Field(
        default="repair_crew",
        description="Used only when the new status is 'assigned'.",
    )
    notes: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def _normalize_status(cls, v):
        if isinstance(v, str):
            return v.lower().strip()
        return v


class StatusUpdateResponse(BaseModel):
    report: PDNAReportOut
    ticket_id: str
    assigned_workforce_id: Optional[str] = None


class DamageReportRow(BaseModel):
    """Row shape for the /admin/damage-reports table + CSV export."""

    tracking_id: str
    damage_category: str
    severity: str
    status: str
    latitude: float
    longitude: float
    created_at: str
    updated_at: str
    assigned_workforce_id: Optional[str] = None


def report_to_out(report) -> PDNAReportOut:
    return PDNAReportOut(**report.to_dict())
