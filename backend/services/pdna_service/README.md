# PDNA Service — Backend

Backend for the Post-Disaster Damage Assessment (PDNA) feature described in
the architecture doc: citizen damage reporting, feeding the Digital Twin's
infra-damage layer and the Workforce dispatch/repair-crew workflow.

Frontend is **not** included here — this is backend-only, per request.

## What's implemented (MVP, per the "Built" list)

- Citizen submission: validate → upload photo → generate tracking ID → insert `pdna_reports`
- Twin Aggregator extension: normalizes `pdna_reports` into `twin_state` as a 4th source (`entity_type: infra_damage`, color/symbol derived from severity)
- Public, no-auth tracking lookup by tracking ID
- Admin: list/filter reports, single-report detail, status workflow (`pending → assigned → resolved`)
- Status change → writes `workforce_assignments` row when status becomes `assigned` (reusing the generic dispatch table, `team_type=repair_crew`) and appends a `tickets` audit row
- CSV export for Public Works handoff (functional, matches the "roadmap: polish formatting" MVP cut)

Not implemented (explicitly marked "roadmap" in the doc, so left out): automated proximity-based crew matching — `team_type`/crew is passed in by the admin action for now.

## Project layout

```
backend/services/pdna_service/
  main.py              FastAPI app / routes
  models.py            SQLAlchemy models: pdna_reports (new), + twin_state,
                        tickets, workforce_assignments (simplified stand-ins
                        for the platform's existing tables — see note below)
  database.py           engine/session setup (SQLite by default)
  schemas.py            Pydantic request/response models
  intake.py              citizen submission logic
  tracking.py            public tracking lookup
  admin.py                admin status-change + list + CSV export logic
  storage.py              photo upload (local disk by default, Supabase optional)
  twin_aggregator/
    normalizer.py         extends the Twin Aggregator with the pdna_reports source
storage/damage-photos/     local stand-in for the Supabase Storage bucket
test_pdna_service.py        end-to-end smoke tests
```

**Important note on `models.py`:** per the architecture doc, `pdna_reports`
is the only genuinely new table — `twin_state`, `tickets`, and
`workforce_assignments` already exist elsewhere on the platform. Since no
existing codebase was provided to integrate into, this backend includes
simplified, self-contained versions of those three tables so the service
is fully runnable and testable standalone. When wiring this into the real
platform repo: delete those three model classes and `import` the
platform's existing ones instead (keep everything in `intake.py`,
`admin.py`, and `twin_aggregator/normalizer.py` — they only touch those
models through plain attribute access, not raw SQL, so the swap is a
one-line import change).

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
uvicorn backend.services.pdna_service.main:app --reload --port 8000
```

Interactive API docs: http://127.0.0.1:8000/docs

By default this uses a local SQLite file (`pdna.db`) and stores photos on
local disk under `storage/damage-photos/`. To point at a real Postgres
database, set `PDNA_DATABASE_URL`. To use real Supabase Storage instead of
local disk, set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (and
`pip install supabase`).

## Test

```bash
python -m pytest test_pdna_service.py -v
```

This runs a full flow against an isolated temp SQLite DB: submit a report →
verify it appears in the Twin layer and admin table → assign a repair crew →
verify the workforce assignment + audit ticket + tracking status update →
resolve it → verify invalid status transitions are rejected → verify CSV
export. All 5 tests pass.

## API reference

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/pdna/reports` | Citizen | Submit a damage report (multipart form: `damage_category`, `severity`, `latitude`, `longitude`, `photo`, optional `reporter_citizen_id`) |
| GET | `/api/pdna/track/{tracking_id}` | Public | Read-only status lookup, no auth |
| GET | `/api/admin/pdna/reports` | Admin | Table view; filter by `status`/`severity` |
| GET | `/api/admin/pdna/reports/{id}` | Admin | Single report detail (for the map popup) |
| PATCH | `/api/admin/pdna/reports/{id}/status` | Admin | Change status (`pending`→`assigned`→`resolved`); body: `{"status": "assigned", "actor": "...", "team_type": "repair_crew", "notes": "..."}` |
| GET | `/api/admin/pdna/reports/export.csv` | Admin | CSV export |
| GET | `/api/twin/infra-damage` | Digital Twin | Feed of derived `twin_state` entries for the warning-triangle map layer |
| GET | `/healthz` | — | Health check |

Allowed status transitions: `pending → assigned`, `pending → resolved`,
`assigned → resolved`, `assigned → pending`. `resolved` is terminal.
Anything else returns `409 Conflict`.

Validation errors (bad category/severity, out-of-range coordinates, bad
photo type/size) return `422` with a descriptive message.
