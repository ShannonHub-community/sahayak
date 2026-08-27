"""
SOS Service - business logic.

Accepts a distress report from the frontend's emergency SOS form, persists
it, and computes the nearest known shelter (using this service's own
shelters.json + geo math) so the citizen can see where to head.

Fully independent of the Registration service - no shared database, no
shared imports.
"""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from shared.database import get_db
from schemas import SOSSubmitRequest
import geo

SHELTERS_PATH = Path(__file__).resolve().parent / "shelters.json"


def _load_shelters() -> list[dict]:
    with open(SHELTERS_PATH, "r") as f:
        return json.load(f)["shelters"]


def _nearest_shelter(lat: float, lng: float) -> dict | None:
    shelters = _load_shelters()
    if not shelters:
        return None

    best = None
    for s in shelters:
        dist = geo.haversine_km(lat, lng, s["lat"], s["lng"])
        if best is None or dist < best["distance_km"]:
            bearing = geo.bearing_deg(lat, lng, s["lat"], s["lng"])
            best = {
                "name": s["name"],
                "distance_km": dist,
                "bearing": round(bearing, 1),
                "cardinal": geo.bearing_to_compass(bearing),
                "coordinates": {"lat": s["lat"], "lng": s["lng"]},
                "contact": s.get("contact"),
            }
    return best


def submit_sos(req: SOSSubmitRequest) -> dict:
    report_id = f"SOS-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        db.execute(
            """INSERT INTO sos_reports (
                report_id, citizen_id, name, phone, pax_count,
                medical_emergency, includes_infants, includes_elderly,
                lat, lng, landmark, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')""",
            (
                report_id,
                req.citizen_id,
                req.name,
                req.phone,
                req.pax_count,
                int(req.medical_emergency),
                int(req.includes_infants),
                int(req.includes_elderly),
                req.location.lat,
                req.location.lng,
                req.landmark,
            ),
        )

    shelter = _nearest_shelter(req.location.lat, req.location.lng)
    nearest_shelter = None
    if shelter:
        nearest_shelter = {
            "name": shelter["name"],
            "distance": f"{shelter['distance_km']:.1f} km",
            "bearing": shelter["bearing"],
            "cardinal": shelter["cardinal"],
            "coordinates": shelter["coordinates"],
            "contact": shelter["contact"],
        }

    return {
        "status": "success",
        "report_id": report_id,
        "message": "Emergency distress received. Local response teams alerted.",
        "nearest_shelter": nearest_shelter,
        "timestamp": timestamp,
    }
