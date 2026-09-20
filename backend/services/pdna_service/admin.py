"""
Admin status-change flow.

    update pdna_reports.status
    -> if status becomes "assigned": write to workforce_assignments
       (reusing the existing dispatch table -- a repair crew is just
       another team type)
    -> log every status change to tickets (append-only audit trail)
    -> refresh the derived Twin Aggregator entry so the map stays in sync
"""
import csv
import io
from typing import List, Optional

from sqlalchemy.orm import Session

from .models import PDNAReport, ReportStatus, Ticket, WorkforceAssignment
from .twin_aggregator.normalizer import upsert_twin_entry

# Only these transitions are allowed. Anything else (e.g. resolved -> pending)
# is rejected so the status history in `tickets` stays meaningful.
_ALLOWED_TRANSITIONS = {
    ReportStatus.pending: {ReportStatus.assigned, ReportStatus.resolved},
    ReportStatus.assigned: {ReportStatus.resolved, ReportStatus.pending},
    ReportStatus.resolved: set(),  # terminal
}


class ReportNotFoundError(LookupError):
    pass


class InvalidTransitionError(ValueError):
    pass


def list_reports(
    db: Session,
    *,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
) -> List[PDNAReport]:
    q = db.query(PDNAReport)
    if status:
        q = q.filter(PDNAReport.status == ReportStatus(status.lower()))
    if severity:
        q = q.filter(PDNAReport.severity == severity.lower())
    return (
        q.order_by(PDNAReport.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_report(db: Session, report_id: str) -> PDNAReport:
    report = db.query(PDNAReport).filter_by(id=report_id).first()
    if report is None:
        raise ReportNotFoundError(f"No pdna_report with id={report_id}")
    return report


def update_status(
    db: Session,
    report_id: str,
    *,
    new_status: ReportStatus,
    actor: str = "admin",
    team_type: str = "repair_crew",
    notes: Optional[str] = None,
) -> tuple[PDNAReport, Ticket, Optional[WorkforceAssignment]]:
    report = get_report(db, report_id)

    old_status = report.status
    if new_status == old_status:
        raise InvalidTransitionError(f"Report is already '{old_status.value}'.")
    if new_status not in _ALLOWED_TRANSITIONS.get(old_status, set()):
        raise InvalidTransitionError(
            f"Cannot transition from '{old_status.value}' to '{new_status.value}'."
        )

    report.status = new_status

    assignment: Optional[WorkforceAssignment] = None
    if new_status == ReportStatus.assigned:
        assignment = WorkforceAssignment(
            team_type=team_type,
            entity_type="pdna_report",
            entity_id=report.id,
            status="assigned",
            notes=notes,
        )
        db.add(assignment)
        db.flush()
        report.assigned_workforce_id = assignment.id

    ticket = Ticket(
        entity_type="pdna_report",
        entity_id=report.id,
        action="status_change",
        detail=f"{old_status.value} -> {new_status.value}" + (f" ({notes})" if notes else ""),
        actor=actor,
    )
    db.add(ticket)
    db.flush()

    # Keep the Digital Twin's derived layer in sync with the new status.
    upsert_twin_entry(db, report)

    db.commit()
    db.refresh(report)
    db.refresh(ticket)
    if assignment is not None:
        db.refresh(assignment)

    return report, ticket, assignment


def export_csv(db: Session) -> str:
    """CSV export for Public Works Department handoff (MVP: functional, unpolished)."""
    reports = list_reports(db, limit=100000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "tracking_id",
            "damage_category",
            "severity",
            "status",
            "latitude",
            "longitude",
            "assigned_workforce_id",
            "created_at",
            "updated_at",
        ]
    )
    for r in reports:
        writer.writerow(
            [
                r.tracking_id,
                r.damage_category.value,
                r.severity.value,
                r.status.value,
                r.latitude,
                r.longitude,
                r.assigned_workforce_id or "",
                r.created_at.isoformat(),
                r.updated_at.isoformat(),
            ]
        )
    return buf.getvalue()
