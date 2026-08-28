# SOS Service

Owns: receiving and logging emergency distress reports, and computing the
nearest known shelter (bearing/distance) from the citizen's location.

Fully independent of the Registration service: no shared database, no
shared imports, no shared process. It doesn't need citizen data to
function — a distress report can be submitted by anyone, registered or not.

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Note the different port (8001) from the Registration service (8000) — run
both at once, in separate terminals, for the full app to work.

Check it's up: `http://localhost:8001/docs` or `curl http://localhost:8001/health`

Uses a local SQLite file (`sos.db`, created automatically). Shelter
locations live in `shelters.json` in this folder — edit that file to add
real shelter data for your deployment.

## Endpoints
- `POST /api/sos`
