"""
Database engine / session wiring for the PDNA service.

Defaults to a local SQLite file so the service runs with zero external
dependencies. Point DATABASE_URL at a real Postgres/PostGIS instance
(the same one the rest of the platform uses) in production, e.g.:

    export DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/platform"

The models in `models.py` use plain float lat/lon columns rather than a
PostGIS `geography(Point)` column so they work unmodified on both SQLite
(dev) and Postgres (prod). If/when this service is wired into the real
platform database (which already uses PostGIS for `location` columns
elsewhere, per the architecture doc), swap `PDNAReport.latitude/longitude`
for a `Geography(Point)` column using GeoAlchemy2 -- the rest of the
code does not care how the coordinate is stored, it only reads
`.latitude` / `.longitude`.
"""
import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get(
    "PDNA_DATABASE_URL",
    "sqlite:///" + os.path.join(os.path.dirname(__file__), "pdna.db"),
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()


def init_db() -> None:
    """Create all tables if they don't already exist. Safe to call repeatedly."""
    # Import models here so they're registered on Base.metadata before create_all.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency: yields a session, always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope():
    """Plain context-manager version for use outside FastAPI (scripts, tests)."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
