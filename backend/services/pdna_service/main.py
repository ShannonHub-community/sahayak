"""
PDNA Service -- FastAPI entrypoint.

Routes (matches the "Triggered by" list in the architecture doc):
    POST /api/pdna/reports              citizen form submission
    GET  /api/pdna/track/{tracking_id}  public, read-only tracking lookup
    GET  /api/admin/pdna/reports        admin table view
    GET  /api/admin/pdna/reports/{id}   admin single-report popup detail
    PATCH /api/admin/pdna/reports/{id}/status   admin status-change action
    GET  /api/admin/pdna/reports/export.csv     CSV export for Public Works
    GET  /api/twin/infra-damage         Digital Twin layer feed (read-only)

Run locally:
    uvicorn backend.services.pdna_service.main:app --reload --port 8000
"""
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from . import admin as admin_logic
from . import intake as intake_logic
from . import tracking as tracking_logic
from .database import get_db, init_db
from .models import ReportStatus, TwinState
from .schemas import (
    DamageReportRow,
    PDNAReportOut,
    StatusUpdateRequest,
    StatusUpdateResponse,
    SubmitResponse,
    TrackResponse,
    report_to_out,
)
from .storage import PhotoValidationError

app = FastAPI(title="PDNA Service", version="1.0.0")

# Create tables eagerly at import time (in addition to the startup hook
# below) so the service also works correctly under test clients / runners
# that don't trigger ASGI lifespan events.
init_db()


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Citizen: submission
# ---------------------------------------------------------------------------


@app.post("/api/pdna/reports", response_model=SubmitResponse, status_code=201)
async def submit_report(
    damage_category: str = Form(...),
    severity: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    reporter_citizen_id: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    photo_bytes = await photo.read()
    try:
        report = intake_logic.submit_report(
            db,
            damage_category=damage_category,
            severity=severity,
            latitude=latitude,
            longitude=longitude,
            photo_filename=photo.filename or "photo.jpg",
            photo_bytes=photo_bytes,
            photo_content_type=photo.content_type,
            reporter_citizen_id=reporter_citizen_id,
        )
    except (intake_logic.IntakeValidationError, PhotoValidationError) as e:
        raise HTTPException(status_code=422, detail=str(e))

    return SubmitResponse(
        tracking_id=report.tracking_id,
        status=report.status.value,
        report=report_to_out(report),
    )


# ---------------------------------------------------------------------------
# Citizen: public tracking lookup (no auth)
# ---------------------------------------------------------------------------


@app.get("/api/pdna/track/{tracking_id}", response_model=TrackResponse)
def track_report(tracking_id: str, db: Session = Depends(get_db)):
    report = tracking_logic.get_report_by_tracking_id(db, tracking_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"No report found for '{tracking_id}'.")
    return TrackResponse(
        tracking_id=report.tracking_id,
        status=report.status.value,
        damage_category=report.damage_category.value,
        severity=report.severity.value,
        created_at=report.created_at.isoformat(),
        updated_at=report.updated_at.isoformat(),
        assigned_workforce_id=report.assigned_workforce_id,
    )


# ---------------------------------------------------------------------------
# Admin: table view + CSV export
# ---------------------------------------------------------------------------


@app.get("/api/admin/pdna/reports", response_model=list[DamageReportRow])
def admin_list_reports(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    try:
        reports = admin_logic.list_reports(
            db, status=status, severity=severity, limit=limit, offset=offset
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return [
        DamageReportRow(
            tracking_id=r.tracking_id,
            damage_category=r.damage_category.value,
            severity=r.severity.value,
            status=r.status.value,
            latitude=r.latitude,
            longitude=r.longitude,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat(),
            assigned_workforce_id=r.assigned_workforce_id,
        )
        for r in reports
    ]


@app.get("/api/admin/pdna/reports/export.csv", response_class=PlainTextResponse)
def admin_export_csv(db: Session = Depends(get_db)):
    return PlainTextResponse(
        content=admin_logic.export_csv(db),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pdna_damage_reports.csv"},
    )


@app.get("/api/admin/pdna/reports/{report_id}", response_model=PDNAReportOut)
def admin_get_report(report_id: str, db: Session = Depends(get_db)):
    try:
        report = admin_logic.get_report(db, report_id)
    except admin_logic.ReportNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return report_to_out(report)


# ---------------------------------------------------------------------------
# Admin: status-change action (popup: Pending -> Assigned -> Resolved)
# ---------------------------------------------------------------------------


@app.patch("/api/admin/pdna/reports/{report_id}/status", response_model=StatusUpdateResponse)
def admin_update_status(
    report_id: str, body: StatusUpdateRequest, db: Session = Depends(get_db)
):
    try:
        new_status = ReportStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid status '{body.status}'.")

    try:
        report, ticket, assignment = admin_logic.update_status(
            db,
            report_id,
            new_status=new_status,
            actor=body.actor or "admin",
            team_type=body.team_type or "repair_crew",
            notes=body.notes,
        )
    except admin_logic.ReportNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except admin_logic.InvalidTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    return StatusUpdateResponse(
        report=report_to_out(report),
        ticket_id=ticket.id,
        assigned_workforce_id=assignment.id if assignment else report.assigned_workforce_id,
    )


# ---------------------------------------------------------------------------
# Digital Twin: infra-damage layer feed (existing Twin Aggregator output)
# ---------------------------------------------------------------------------


@app.get("/api/twin/infra-damage")
def twin_infra_damage_layer(db: Session = Depends(get_db)):
    entries = db.query(TwinState).filter_by(entity_type="infra_damage").all()
    return [e.to_dict() for e in entries]
