"""
SOS Service — standalone entry point.

Owns: receiving and logging emergency distress reports (POST /api/sos)
and computing the nearest known shelter. Fully independent of the
Registration service — separate database, separate process, separate port.

Run with (from this folder):
    uvicorn main:app --reload --port 8001
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router import sos_submit_router

app = FastAPI(title="Sahayak SOS Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sos_submit_router)


@app.get("/health")
def health():
    return {"status": "ok"}
