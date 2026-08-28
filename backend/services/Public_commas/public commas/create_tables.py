"""
One-off table creation for a quick manual test run — creates
sms_alert_drafts, press_release_drafts, and news_timeline directly from the
SQLAlchemy models, without needing a full Alembic migration set up first.

For a real deployment, generate a proper Alembic migration instead (see
README.md) so this service's schema is tracked alongside the rest of your
app's migration history. This script is a convenience for local/manual runs.

Usage:
    export DATABASE_URL="postgresql+asyncpg://postgres:<password>@<host>:6543/postgres"
    python create_tables.py
"""
import asyncio

from db import get_engine
from models import Base


async def main():
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("news_report tables created (sms_alert_drafts, press_release_drafts, news_timeline)")


if __name__ == "__main__":
    asyncio.run(main())
