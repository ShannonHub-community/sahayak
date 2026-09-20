"""
Public tracking lookup: read-only, no auth required, per the spec's
"closing the loop" note (mirrors the News Report tab's transparency
principle).
"""
from typing import Optional

from sqlalchemy.orm import Session

from .models import PDNAReport


def get_report_by_tracking_id(db: Session, tracking_id: str) -> Optional[PDNAReport]:
    tracking_id = (tracking_id or "").strip().upper()
    if not tracking_id:
        return None
    return db.query(PDNAReport).filter_by(tracking_id=tracking_id).first()
