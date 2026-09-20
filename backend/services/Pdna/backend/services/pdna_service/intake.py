"""
Citizen submission flow.

    validate fields -> upload photo to storage -> generate tracking ID
    -> insert into pdna_reports -> feed Twin Aggregator

This module has no FastAPI/HTTP concerns -- `main.py` is a thin adapter
around `submit_report`. Keeping the logic here means it's independently
unit-testable and reusable (e.g. from a batch import script) without
spinning up the web server.
"""
import random
import string
from typing import Optional

from sqlalchemy.orm import Session

from .models import DamageCategory, PDNAReport, ReportStatus, Severity
from .storage import upload_photo, PhotoValidationError
from .twin_aggregator.normalizer import upsert_twin_entry


class IntakeValidationError(ValueError):
    """Raised for any bad/missing field in a citizen submission."""


def _generate_tracking_id(db: Session, attempts: int = 10) -> str:
    """e.g. PDNA-4821. Retries on the (very unlikely) collision."""
    for _ in range(attempts):
        candidate = "PDNA-" + "".join(random.choices(string.digits, k=4))
        exists = db.query(PDNAReport).filter_by(tracking_id=candidate).first()
        if not exists:
            return candidate
    raise RuntimeError("Could not generate a unique tracking ID; please retry.")


def _validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> None:
    if latitude is None or longitude is None:
        raise IntakeValidationError(
            "Missing geolocation. The citizen form auto-geotags via the SOS hook; "
            "location capture must succeed before submission."
        )
    if not (-90.0 <= latitude <= 90.0):
        raise IntakeValidationError(f"Latitude {latitude} out of range [-90, 90].")
    if not (-180.0 <= longitude <= 180.0):
        raise IntakeValidationError(f"Longitude {longitude} out of range [-180, 180].")


def _validate_category(damage_category: str) -> DamageCategory:
    valid = {c.value: c for c in DamageCategory}
    if damage_category not in valid:
        raise IntakeValidationError(
            f"Invalid damage_category '{damage_category}'. Must be one of: {sorted(valid)}"
        )
    return valid[damage_category]


def _validate_severity(severity: str) -> Severity:
    try:
        return Severity(severity.lower().strip())
    except ValueError:
        raise IntakeValidationError(
            f"Invalid severity '{severity}'. Must be one of: {[s.value for s in Severity]}"
        )


def submit_report(
    db: Session,
    *,
    damage_category: str,
    severity: str,
    latitude: Optional[float],
    longitude: Optional[float],
    photo_filename: str,
    photo_bytes: bytes,
    photo_content_type: Optional[str],
    reporter_citizen_id: Optional[str] = None,
) -> PDNAReport:
    """
    Validates and persists a citizen damage report, uploads the photo,
    and pushes a derived entry into the Digital Twin via the (extended)
    Twin Aggregator. Returns the persisted PDNAReport.

    Raises IntakeValidationError / PhotoValidationError on bad input.
    """
    category_enum = _validate_category(damage_category)
    severity_enum = _validate_severity(severity)
    _validate_coordinates(latitude, longitude)

    # Photo upload happens before the DB insert so we never persist a
    # report pointing at a photo that failed to upload.
    photo_url = upload_photo(photo_filename, photo_bytes, photo_content_type)

    tracking_id = _generate_tracking_id(db)

    report = PDNAReport(
        tracking_id=tracking_id,
        reporter_citizen_id=reporter_citizen_id,
        photo_url=photo_url,
        damage_category=category_enum,
        severity=severity_enum,
        status=ReportStatus.pending,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(report)
    db.flush()  # populate report.id / created_at before the Twin write

    # Twin Aggregator: extended to poll/subscribe to pdna_reports; here we
    # call it synchronously on write, which is the simplest correct
    # implementation and matches "new 4th source" in the architecture doc.
    upsert_twin_entry(db, report)

    db.commit()
    db.refresh(report)
    return report
