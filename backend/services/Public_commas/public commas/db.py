"""
Database wiring for news_report.

If the host application already has a shared `Base` / async session factory
(most FastAPI + SQLAlchemy backends do, typically in `backend/db.py` or
`backend/core/database.py`), replace the two lines below with an import of
that shared object so `news_report`'s tables live in the same migration
history as the rest of the app:

    from backend.db import Base, get_session  # noqa

This file is intentionally self-contained so the service can be dropped in
and migrated independently if no shared session factory exists yet.

SUPABASE NOTE: by default Supabase connections go through its pgbouncer
pooler in "Transaction mode", which does not support prepared statements.
asyncpg uses prepared statements by default, which causes cryptic
"prepared statement does not exist" errors under load if left on. We
disable statement caching automatically whenever the connection string
looks like a Supabase pooler host (port 6543, or a `pooler.supabase.com`
host) so this works out of the box either way:
  - DATABASE_URL from the pooler (port 6543)   -> statement cache disabled
  - DATABASE_URL "direct connection" (port 5432) -> statement cache left on
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from .config import DBConfig


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _is_pgbouncer_pooler(url: str) -> bool:
    return ":6543" in url or "pooler.supabase.com" in url


def get_engine():
    global _engine
    if _engine is None:
        url = DBConfig().url
        connect_args = {}
        if url.startswith("postgresql+asyncpg://") and _is_pgbouncer_pooler(url):
            # Required for Supabase's pgbouncer "Transaction mode" pooler -
            # see module docstring above.
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_cache_size"] = 0
        _engine = create_async_engine(url, pool_pre_ping=True, connect_args=connect_args)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(), expire_on_commit=False, class_=AsyncSession
        )
    return _session_factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: `session: AsyncSession = Depends(get_session)`"""
    factory = get_session_factory()
    async with factory() as session:
        yield session
