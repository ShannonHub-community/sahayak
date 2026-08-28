"""
Standalone mock for the Flood Engine + Twin Aggregator, so the SOS service
can be demoed / tested end-to-end without the real services running.

Run with:
    uvicorn services.flood_engine.mock_server:app --port 9001

Point config.flood_engine_url / config.twin_aggregator_url at this process
(default ports 9001 already match config.py's defaults) for local testing.
"""
from fastapi import FastAPI

app = FastAPI(title="Sahayak Mock: Flood Engine + Twin Aggregator")

_twin_state = {"sos_reports": {}}


@app.get("/drift-offset")
def drift_offset():
    """Static demo offset; a real Flood Engine would compute this from
    current flood-model drift analysis."""
    return {"lat_offset": 0.00015, "lon_offset": -0.00010}


@app.post("/ingest/sos")
def ingest_sos(report: dict):
    _twin_state["sos_reports"][report["id"]] = report
    return {"status": "ok", "twin_state_size": len(_twin_state["sos_reports"])}


@app.get("/twin_state")
def twin_state():
    return _twin_state
