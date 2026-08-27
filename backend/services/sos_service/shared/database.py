"""
SQLite database helper for the SOS service.

Owns just its own `sos_reports` table — this service does not read or
write citizen/registration data, so it has no dependency on the
Registration service's database.
"""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.getenv("SAHAYAK_SOS_DB_PATH", Path(__file__).resolve().parent.parent / "sos.db"))

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sos_reports (
    report_id         TEXT PRIMARY KEY,
    citizen_id        TEXT,
    name              TEXT,
    phone             TEXT,
    pax_count         INTEGER,
    medical_emergency INTEGER NOT NULL DEFAULT 0,
    includes_infants  INTEGER NOT NULL DEFAULT 0,
    includes_elderly  INTEGER NOT NULL DEFAULT 0,
    lat               REAL,
    lng               REAL,
    landmark          TEXT,
    status            TEXT NOT NULL DEFAULT 'received',
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(_SCHEMA)
    conn.commit()


@contextmanager
def get_db():
    """Yields a sqlite3 connection with Row access, inside a transaction."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    _init_schema(conn)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
