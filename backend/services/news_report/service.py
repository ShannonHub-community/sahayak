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
       timestamp/state - no admin/internal fields. Optionally filtered
       to a single Indian state.
    translate_alerts / get_audio_for_alert / get_state_from_coordinates
    -> backend halves of the three Live Updates additions from Prompt 6:
       translation toggle, per-card text-to-speech, and GPS-based state
       filtering. All the actual Sarvam API calls live in sarvam_client;
       this module just wires requests to it and fails gracefully.
"""
from fastapi import HTTPException

from backend.shared.database import get_db
from backend.services.news_report import sarvam_client
from backend.services.news_report.geo_lookup import lookup_state
from backend.services.news_report.schemas import (
    AlertCreateRequest,
    AlertUpdateRequest,
    StateLookupRequest,
    TranslateRequest,
    TTSRequest,
)

PUBLIC_FEED_PAGE_SIZE = 20

_state_column_ensured = False


def _ensure_state_column() -> None:
    """Best-effort migration: add the `state` column to Public_Alerts if
    it isn't there yet. Guarded so it only runs once per process, and
    swallows the "duplicate column" error SQLite raises if it's already
    present (or does nothing useful if the table doesn't exist at all -
    that's a genuine setup problem the normal queries will surface)."""
    global _state_column_ensured
    if _state_column_ensured:
        return
    try:
        with get_db() as db:
            db.execute("ALTER TABLE Public_Alerts ADD COLUMN state TEXT")
    except Exception:
        pass
    finally:
        _state_column_ensured = True


# ---------------------------------------------------------------------
# Admin: create / list / get / update alerts
# ---------------------------------------------------------------------
def create_alert(req: AlertCreateRequest) -> dict:
    _ensure_state_column()
    state = req.state.strip() if req.state else None
    with get_db() as db:
        cur = db.execute(
            """INSERT INTO Public_Alerts (title, message, severity, created_by, state)
               VALUES (?, ?, ?, ?, ?)""",
            (req.title.strip(), req.message.strip(), req.severity, req.created_by, state),
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
    _ensure_state_column()
    fields = req.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update")

    # Allow explicitly clearing state back to nationwide with "".
    if "state" in fields and fields["state"] == "":
        fields["state"] = None

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
def get_public_feed(page: int = 1, state: str | None = None) -> dict:
    """Triggered by the user loading the "Live Updates" tab. Pulls the
    latest 20 active alerts, ordered by timestamp newest first, reading
    only title/message/severity/state/timestamp from Public_Alerts.

    When `state` is given (e.g. resolved from the citizen's GPS via
    `get_state_from_coordinates`), only alerts targeted at that state
    plus nationwide alerts (state IS NULL) are returned. When `state`
    is None - because location wasn't available, or the caller just
    wants everything - every active alert is returned, matching the
    previous unfiltered behaviour."""
    _ensure_state_column()
    page = max(page, 1)
    offset = (page - 1) * PUBLIC_FEED_PAGE_SIZE
    state = state.strip() if state else None

    with get_db() as db:
        if state:
            rows = db.execute(
                """SELECT alert_id, title, message, severity, state, timestamp
                   FROM Public_Alerts
                   WHERE status = 'active' AND (state IS NULL OR state = ?)
                   ORDER BY timestamp DESC, alert_id DESC
                   LIMIT ? OFFSET ?""",
                (state, PUBLIC_FEED_PAGE_SIZE, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT alert_id, title, message, severity, state, timestamp
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
        "state_filter": state,
        "alerts": alerts,
    }


# ---------------------------------------------------------------------
# Public: translation toggle (Prompt 6, item 1)
# ---------------------------------------------------------------------
def translate_alerts(req: TranslateRequest) -> dict:
    """Translate each alert's title/message via Sarvam. English is a
    no-op passthrough. Failures are handled per-item, not for the whole
    batch: if Sarvam is unreachable or a single item fails, that item
    falls back to its original (untranslated) text rather than the
    frontend getting an empty/broken feed."""
    if req.language == "en":
        return {"items": [{"id": it.id, "title": it.title, "message": it.message} for it in req.items]}

    target_code = sarvam_client.LANGUAGE_CODE_MAP[req.language]

    results = []
    for item in req.items:
        try:
            translated_title = sarvam_client.translate_text(item.title, target_code)
            translated_message = sarvam_client.translate_text(item.message, target_code)
        except sarvam_client.SarvamAPIError:
            translated_title, translated_message = item.title, item.message
        results.append({"id": item.id, "title": translated_title, "message": translated_message})

    return {"items": results}


# ---------------------------------------------------------------------
# Public: per-card text-to-speech (Prompt 6, item 2)
# ---------------------------------------------------------------------
def get_audio_for_alert(req: TTSRequest) -> bytes:
    """Synthesize speech for one alert's text via Sarvam. Unlike
    translation, there's no sensible "fallback text" for audio, so a
    genuine failure here surfaces as a 502 and the frontend button shows
    its inline retry state, per the prompt."""
    target_code = sarvam_client.LANGUAGE_CODE_MAP.get(req.language, "en-IN")
    try:
        return sarvam_client.synthesize_speech(req.text, target_code)
    except sarvam_client.SarvamAPIError as exc:
        raise HTTPException(status_code=502, detail=f"Text-to-speech is temporarily unavailable: {exc}") from exc


# ---------------------------------------------------------------------
# Public: GPS -> state lookup for feed filtering (Prompt 6, item 3)
# ---------------------------------------------------------------------
def get_state_from_coordinates(req: StateLookupRequest) -> dict:
    """Resolve raw GPS coordinates to an Indian state name, or None if
    they don't fall inside any known state/UT (e.g. outside India)."""
    return {"state": lookup_state(req.lat, req.lng)}
