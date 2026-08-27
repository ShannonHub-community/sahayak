"""
SQLite database helper for the Registration service.

Provides a `get_db()` context manager that yields a sqlite3 connection
(row_factory = sqlite3.Row so columns are addressable by name, e.g. row["phone"])
and makes sure this service's own tables exist.

This is intentionally simple (SQLite, single file) so the service can run
standalone for development/demo purposes. Swap this module out for a
Postgres/Supabase-backed implementation later without touching service.py,
as long as `get_db()` keeps yielding something that supports the same
`execute(...)/fetchone()/fetchall()` interface with Row-style access.
"""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.getenv("SAHAYAK_REGISTRATION_DB_PATH", Path(__file__).resolve().parent.parent / "registration.db"))

_SCHEMA = """
CREATE TABLE IF NOT EXISTS registration_sessions (
    session_id         TEXT PRIMARY KEY,
    phone               TEXT NOT NULL,
    otp_code            TEXT,
    otp_verified        INTEGER NOT NULL DEFAULT 0,
    otp_attempts        INTEGER NOT NULL DEFAULT 0,
    identity_verified   INTEGER NOT NULL DEFAULT 0,
    aadhaar_last4       TEXT,
    expires_at          TEXT NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS citizens (
    citizen_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name               TEXT NOT NULL,
    age                     INTEGER,
    gender                  TEXT,
    phone                   TEXT NOT NULL,
    blood_group             TEXT,
    diseases                TEXT NOT NULL DEFAULT '[]',
    medical_conditions      TEXT,
    home_location_lat       REAL,
    home_location_lng       REAL,
    current_location_lat    REAL,
    current_location_lng    REAL,
    address_text            TEXT,
    identity_verified       INTEGER NOT NULL DEFAULT 0,
    aadhaar_last4           TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_members (
    family_member_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id           INTEGER NOT NULL REFERENCES citizens(citizen_id),
    full_name            TEXT NOT NULL,
    age                  INTEGER,
    gender               TEXT,
    relation             TEXT,
    blood_group          TEXT,
    diseases             TEXT NOT NULL DEFAULT '[]',
    medical_conditions   TEXT
);

CREATE TABLE IF NOT EXISTS browser_tokens (
    token          TEXT PRIMARY KEY,
    citizen_id     INTEGER NOT NULL REFERENCES citizens(citizen_id),
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at   TEXT
);
"""


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(_SCHEMA)
    conn.commit()


@contextmanager
def get_db():
    """Yields a sqlite3 connection with Row access, inside a transaction.

    Commits on clean exit, rolls back on exception. Foreign keys are
    enabled and the schema is ensured on every connection (cheap no-op
    once tables exist).
    """
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
