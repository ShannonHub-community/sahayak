# news_report service

Backend logic for the admin "News & Public Report" tab: SMS alerts (Sub-Tab 1),
press releases (Sub-Tab 2), and the auto-generated public timeline (Sub-Tab 3).

## Files

| File | Responsibility |
|---|---|
| `alerts.py` | Sub-Tab 1 — zone click → draft SMS → admin edits → Broadcast → SMS Gateway |
| `press.py` | Sub-Tab 2 — template select → draft release → admin edits → Publish → Press Portal |
| `timeline.py` | Sub-Tab 3 — event bus listener → AI-format → store (`public_visible=True`) → live push; admin visibility toggle → resync |
| `ai_client.py` | Every call to the shared AI model API lives here (prompts, retries, JSON validation) |
| `external_clients.py` | Digital Twin, SMS Gateway, Press Portal, Audit Trail (REST + event bus), Citizen Portal push |
| `models.py` | `sms_alert_drafts`, `press_release_drafts`, `news_timeline` tables |
| `schemas.py` | Pydantic request/response models |
| `router.py` | FastAPI routes + the Citizen Portal websocket |
| `db.py` | Async SQLAlchemy engine/session (swap for the host app's existing session factory if one exists) |
| `templates.py` | Placeholder press-template lookup — replace with the real template store |

## Wiring into the host app

```python
from backend.services.news_report.router import router as news_report_router
app.include_router(news_report_router)

import asyncio
from backend.services.news_report.timeline import run_timeline_listener

@app.on_event("startup")
async def _start_news_report_listener():
    # Sub-Tab 3 has no UI trigger — this background task is what feeds it.
    asyncio.create_task(run_timeline_listener())
```

If the host app already has a shared `Base` / session factory, replace the
contents of `db.py` with an import of that shared object so `news_report`'s
tables live in the same Alembic migration history as everything else, e.g.:

```python
from backend.db import Base, get_session  # noqa
```

## Database migration

Generate a migration for the three tables in `models.py`
(`sms_alert_drafts`, `press_release_drafts`, `news_timeline`) using the
host app's normal Alembic workflow, e.g.:

```
alembic revision --autogenerate -m "news_report: alerts, press, timeline tables"
alembic upgrade head
```

**Quick manual run without Alembic:** `create_tables.py` creates the three
tables directly from the models — useful the first time you're just trying
this against a real Supabase project by hand:

```
export DATABASE_URL="postgresql+asyncpg://postgres:<password>@<host>:6543/postgres"
python create_tables.py
```

## Running this against Supabase specifically

The code connects via plain SQLAlchemy/asyncpg pointed at Supabase's
underlying Postgres — **it needs `DATABASE_URL` (a Postgres connection
string), not the Supabase anon/service-role API key.** Get it from:
Supabase dashboard → your project → Project Settings → Database →
Connection string → URI. Use the **pooler** connection (port `6543`,
"Transaction" mode) unless you have a specific reason to connect directly
on `5432`.

`db.py` auto-detects the pooler (port `6543` or a `pooler.supabase.com`
host) and disables asyncpg's prepared-statement cache for it — Supabase's
pgbouncer pooler in Transaction mode doesn't support prepared statements,
and leaving them on causes intermittent `prepared statement "..." does not
exist` errors under load. No action needed on your end, just don't
override `connect_args` when constructing the engine.

You'd only need an actual Supabase **API key** (anon or service role) if
you also plan to call Supabase's REST/PostgREST API, Auth, or Storage
directly — none of that is used by this module as written.

## Required environment variables

| Var | Used by |
|---|---|
| `AI_MODEL_API_URL`, `AI_MODEL_API_KEY` | `ai_client.py` (shared AI model, same one used by the AI Decision System) |
| `AI_MODEL_NAME` (default `claude-sonnet-4-6`) | `ai_client.py` |
| `SMS_GATEWAY_URL`, `SMS_GATEWAY_API_KEY` | `alerts.py` broadcast |
| `PRESS_PORTAL_URL`, `PRESS_PORTAL_API_KEY` | `press.py` publish |
| `DIGITAL_TWIN_API_URL`, `DIGITAL_TWIN_API_KEY` | `alerts.py` zone data pull |
| `AUDIT_TRAIL_API_URL`, `AUDIT_TRAIL_API_KEY` | `press.py` historical log pull |
| `EVENT_BUS_URL`, `AUDIT_TRAIL_EVENT_CHANNEL` (default `audit_trail.events`) | `timeline.py` live listener (Redis pub/sub assumed — see `AuditTrailEventBus`) |
| `CITIZEN_PORTAL_RESYNC_URL`, `CITIZEN_PORTAL_API_KEY` (optional) | `timeline.py` fallback resync webhook, in addition to the live websocket |
| `DATABASE_URL` | `db.py` |

## Design notes / things to check before shipping

- **Event bus transport is assumed to be Redis pub/sub** (`AuditTrailEventBus`
  uses `redis.asyncio`). If Twin Aggregator / the audit trail actually publish
  via Kafka, SNS, or a webhook instead, only `AuditTrailEventBus.subscribe()`
  in `external_clients.py` needs to change — `timeline.py` just consumes an
  async generator of event dicts, so it's decoupled from the transport.
- **Idempotency**: `news_timeline.source_event_id` is unique, so a redelivered
  event from the bus is a safe no-op rather than a duplicate timeline entry
  (verified in the smoke test below).
- **No double-send**: both `SmsAlertDraft.status` and `PressReleaseDraft.status`
  gate broadcast/publish (`drafted → broadcasting/publishing → broadcast/
  published | failed`), so retrying a request against an already-sent draft
  is rejected (409), not re-sent.
- **AI failures never corrupt state**: `ai_client.py` raises `AIClientError`
  on malformed/empty model output; `timeline.py`'s listener catches it per-
  event and moves on (a bad event never takes the whole listener down),
  while `alerts.py`/`press.py` let it surface as a 502 to the admin UI so a
  bad draft is never silently stored as if it succeeded.
- **Templates** in `templates.py` are a placeholder in-memory dict — swap
  `get_template()` for a real template-management table/service.
- Verified end-to-end (draft → edit → broadcast/publish, event → format →
  store → visibility toggle → resync, including the no-double-send and
  idempotency guards above) against an in-memory SQLite DB with faked AI/
  external clients.
