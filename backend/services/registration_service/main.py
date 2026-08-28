"""
Registration Service — standalone entry point.

Owns: OTP verification, mock Aadhaar verification, final citizen
registration, and the SOS-tab auto-fill lookup (since that reads the
citizen data this service owns).

Run with (from this folder):
    uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router import registration_router, sos_router

app = FastAPI(title="Sahayak Registration Service", version="0.1.0")

# Allow the Next.js dev server (and any origin in dev) to call these APIs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registration_router)
app.include_router(sos_router)  # GET /api/sos/autofill


@app.get("/health")
def health():
    return {"status": "ok"}
