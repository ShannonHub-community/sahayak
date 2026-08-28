# Registration Service

Owns: mobile OTP verification, mock Aadhaar verification, final citizen
registration + personalized offline guide bundle, and the SOS-tab
auto-fill lookup (since that reads citizen data this service owns).

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it's up: `http://localhost:8000/docs` or `curl http://localhost:8000/health`

Uses a local SQLite file (`registration.db`, created automatically next to
this folder on first run). Swap `shared/database.py`'s `get_db()` for a
Postgres/Supabase connection later without touching `service.py`.

## Endpoints
- `POST /api/registration/otp/send`
- `POST /api/registration/otp/verify`
- `POST /api/registration/aadhaar/verify`
- `POST /api/registration/submit`
- `GET  /api/sos/autofill`

## Note
This service is completely independent of `sos_service` — separate
process, separate database, separate deployable unit. The only thing they
share is that both are called by the same frontend.
