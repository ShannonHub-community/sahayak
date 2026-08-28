"""
News Report Service - business logic.

Admin side (News Report tab):
    create_alert / list_alerts / get_alert / update_alert
    -> create, list (all statuses, for the admin table view), and
       update/archive an existing alert in `Public_Alerts`.

Public side (Citizen App "Live Updates" tab):
    get_public_feed
    -> a simple read that pulls the latest 20 *active* alerts, ordered
       by timestamp newest first. Only exposes title/message/severity/
       timestamp - no admin/internal fields.
"""
from fastapi import HTTPException

from backend.shared.database import get_db
from backend.services.news_report.schemas import AlertCreateRequest, AlertUpdateRequest

PUBLIC_FEED_PAGE_SIZE = 20


# ---------------------------------------------------------------------
# Admin: create / list / get / update alerts
# ---------------------------------------------------------------------
def create_alert(req: AlertCreateRequest) -> dict:
    with get_db() as db:
        cur = db.execute(
            """INSERT INTO Public_Alerts (title, message, severity, created_by)
               VALUES (?, ?, ?, ?)""",
            (req.title.strip(), req.message.strip(), req.severity, req.created_by),
        )
        alert_id = cur.lastrowid
        row = db.execute("SELECT * FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
    return dict(row)


def list_alerts(status: str | None = None, page: int = 1, page_size: int = 20) -> list[dict]:
    """Admin listing - unlike the public feed, this can include archived
    alerts (via `status` filter) and is not limited to the latest 20 only
    by default paging conventions."""
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size

    with get_db() as db:
        if status:
            rows = db.execute(
                """SELECT * FROM Public_Alerts WHERE status = ?
                   ORDER BY timestamp DESC, alert_id DESC LIMIT ? OFFSET ?""",
                (status, page_size, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT * FROM Public_Alerts
                   ORDER BY timestamp DESC, alert_id DESC LIMIT ? OFFSET ?""",
                (page_size, offset),
            ).fetchall()
    return [dict(r) for r in rows]


def get_alert(alert_id: int) -> dict:
    with get_db() as db:
        row = db.execute("SELECT * FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return dict(row)


def update_alert(alert_id: int, req: AlertUpdateRequest) -> dict:
    fields = req.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update")

    set_clause = ", ".join(f"{col} = ?" for col in fields.keys())
    values = list(fields.values())

    with get_db() as db:
        existing = db.execute("SELECT alert_id FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Alert not found")

        db.execute(
            f"UPDATE Public_Alerts SET {set_clause}, updated_at = datetime('now') WHERE alert_id = ?",
            (*values, alert_id),
        )
        row = db.execute("SELECT * FROM Public_Alerts WHERE alert_id = ?", (alert_id,)).fetchone()
    return dict(row)


# ---------------------------------------------------------------------
# Public: Live Updates feed
# ---------------------------------------------------------------------
def get_public_feed(page: int = 1) -> dict:
    """Triggered by the user loading the "Live Updates" tab. Pulls the
    latest 20 active alerts, ordered by timestamp newest first, reading
    only title/message/severity/timestamp from Public_Alerts."""
    page = max(page, 1)
    offset = (page - 1) * PUBLIC_FEED_PAGE_SIZE

    with get_db() as db:
        rows = db.execute(
            """SELECT alert_id, title, message, severity, timestamp
               FROM Public_Alerts
               WHERE status = 'active'
               ORDER BY timestamp DESC, alert_id DESC
               LIMIT ? OFFSET ?""",
            (PUBLIC_FEED_PAGE_SIZE, offset),
        ).fetchall()

    alerts = [dict(r) for r in rows]
    return {
        "page": page,
        "page_size": PUBLIC_FEED_PAGE_SIZE,
        "count": len(alerts),
        "alerts": alerts,
    }
