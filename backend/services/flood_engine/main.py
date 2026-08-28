"""
main.py — FastAPI application entrypoint for the Sahayak backend.

Was missing entirely — there was no ASGI app to point uvicorn at, so
nothing could actually be started regardless of whether imports worked.

Run with:
    uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI

from services.flood_engine.router import router as flood_engine_router

app = FastAPI(title="Sahayak Backend")

app.include_router(flood_engine_router)


@app.get("/health")
def health():
    return {"status": "ok"}
