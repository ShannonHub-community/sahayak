"""
Extension to the existing Twin Aggregator service.

Per the architecture doc: "Twin Aggregator (existing service) extended
to also poll/subscribe to pdna_reports -> normalize into twin_state with
entity_type: infra_damage, symbol/color derived from severity."

This file intentionally only adds the *new source* (pdna_reports). It
does not touch however the Aggregator already normalizes its other
three sources -- in the real codebase this function is one more
registered normalizer, called the same way as the others.
"""
import json

from sqlalchemy.orm import Session

from ..models import PDNAReport, SEVERITY_COLOR, TwinState

SOURCE_TABLE = "pdna_reports"
ENTITY_TYPE = "infra_damage"
SYMBOL = "warning_triangle"


def _build_payload(report: PDNAReport) -> str:
    return json.dumps(
        {
            "tracking_id": report.tracking_id,
            "photo_url": report.photo_url,
            "damage_category": report.damage_category.value,
            "severity": report.severity.value,
            "status": report.status.value,
        }
    )


def upsert_twin_entry(db: Session, report: PDNAReport) -> TwinState:
    """
    Insert or refresh the twin_state row derived from a single pdna_reports
    row. Called on submission and on every status change, so the map
    layer and the underlying report never drift out of sync.
    """
    entry = (
        db.query(TwinState)
        .filter_by(source_table=SOURCE_TABLE, source_id=report.id)
        .first()
    )
    if entry is None:
        entry = TwinState(
            entity_type=ENTITY_TYPE,
            source_table=SOURCE_TABLE,
            source_id=report.id,
        )
        db.add(entry)

    entry.symbol = SYMBOL
    entry.color = SEVERITY_COLOR[report.severity]
    entry.latitude = report.latitude
    entry.longitude = report.longitude
    entry.payload = _build_payload(report)

    db.flush()
    return entry


def remove_twin_entry(db: Session, report: PDNAReport) -> None:
    """Not currently triggered anywhere (reports aren't deleted), but kept
    for completeness / parity with the other three Aggregator sources."""
    db.query(TwinState).filter_by(
        source_table=SOURCE_TABLE, source_id=report.id
    ).delete()
    db.flush()
