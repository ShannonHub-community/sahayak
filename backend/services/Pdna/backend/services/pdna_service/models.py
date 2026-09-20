"""
ORM models for the PDNA feature.

Per the architecture doc, only `pdna_reports` is a genuinely new table.
`twin_state`, `tickets`, and `workforce_assignments` already exist
elsewhere on the platform -- they're modeled here (in a simplified,
self-contained form) purely so this service is runnable and testable on
its own. When wiring into the real platform repo, delete these three
classes from here and import the platform's existing models instead;
keep `PDNAReport`.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DamageCategory(str, enum.Enum):
    collapsed_structure = "Collapsed Structure"
    blocked_road = "Blocked Road"
    flooded_infrastructure = "Flooded Infrastructure"
    downed_power_lines = "Downed Power Lines"
    contaminated_water = "Contaminated Water"


class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    critical = "critical"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    resolved = "resolved"


# Severity -> Digital Twin warning-triangle color, per spec (Yellow/Orange/Black)
SEVERITY_COLOR = {
    Severity.low: "yellow",
    Severity.medium: "orange",
    Severity.critical: "black",
}


class PDNAReport(Base):
    """New table: citizen-submitted post-disaster infrastructure damage report."""

    __tablename__ = "pdna_reports"

    id = Column(String, primary_key=True, default=_uuid)
    tracking_id = Column(String, unique=True, nullable=False, index=True)
    reporter_citizen_id = Column(String, nullable=True)

    photo_url = Column(String, nullable=False)
    damage_category = Column(Enum(DamageCategory), nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.pending)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    assigned_workforce_id = Column(String, ForeignKey("workforce_assignments.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    assignment = relationship("WorkforceAssignment", foreign_keys=[assigned_workforce_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tracking_id": self.tracking_id,
            "reporter_citizen_id": self.reporter_citizen_id,
            "photo_url": self.photo_url,
            "damage_category": self.damage_category.value if self.damage_category else None,
            "severity": self.severity.value if self.severity else None,
            "status": self.status.value if self.status else None,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "assigned_workforce_id": self.assigned_workforce_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TwinState(Base):
    """
    Existing table (simplified stand-in here): the Digital Twin's rendering
    source. The Twin Aggregator writes derived, denormalized entries here;
    admin map layers read from here. Supports arbitrary entity_type values,
    so no schema change was needed to add `infra_damage`.
    """

    __tablename__ = "twin_state"

    id = Column(String, primary_key=True, default=_uuid)
    entity_type = Column(String, nullable=False, index=True)  # e.g. "infra_damage"
    source_table = Column(String, nullable=False)  # e.g. "pdna_reports"
    source_id = Column(String, nullable=False, index=True)  # pdna_reports.id

    symbol = Column(String, nullable=True)  # "warning_triangle"
    color = Column(String, nullable=True)  # yellow / orange / black

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    payload = Column(Text, nullable=True)  # JSON blob: photo_url, category, severity, status, etc.

    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    def to_dict(self) -> dict:
        import json

        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "source_table": self.source_table,
            "source_id": self.source_id,
            "symbol": self.symbol,
            "color": self.color,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "payload": json.loads(self.payload) if self.payload else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Ticket(Base):
    """Existing table (simplified stand-in): append-only audit trail."""

    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=_uuid)
    entity_type = Column(String, nullable=False)  # "pdna_report"
    entity_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # e.g. "status_change"
    detail = Column(Text, nullable=True)
    actor = Column(String, nullable=True)  # who made the change (admin id / "citizen" / "system")
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action": self.action,
            "detail": self.detail,
            "actor": self.actor,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WorkforceAssignment(Base):
    """Existing table (simplified stand-in): generic team-dispatch mechanism."""

    __tablename__ = "workforce_assignments"

    id = Column(String, primary_key=True, default=_uuid)
    team_type = Column(String, nullable=False)  # "repair_crew"
    entity_type = Column(String, nullable=False)  # "pdna_report"
    entity_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="assigned")  # assigned / in_progress / completed
    assigned_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    notes = Column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "team_type": self.team_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "status": self.status,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "notes": self.notes,
        }
