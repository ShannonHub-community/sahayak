"""
Registration Service - business logic.

Covers the full Registration Tab flow:

    OTP submit -> verify via mock OTP service -> on success, proceed to next step
    Mock Aadhaar submit -> verify -> mark identity as verified
    Final form submit -> validate + store profile (Section 2) and family
        roster (Section 3) in the database, generate a browser-stored
        identifier, and call Guide Personalization to bundle disease-matched
        guides + flood/first-aid guides + a compass-based shelter map for
        the frontend to cache via its Service Worker.
    SOS tab load -> look up a citizen by their browser-stored identifier
        and return auto-fill data (or nothing, if unregistered).

Sections below mirror those responsibilities:
    - OTP / Aadhaar verification (registration_sessions bookkeeping)
    - Guide personalization (static content bank matching + shelter geometry)
    - Final submit (persists citizens + family_members, issues browser token)
    - SOS auto-fill lookup
"""
import json
import math
import secrets
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import HTTPException

from shared import identity_verification as idv
from shared.database import get_db
from schemas import RegistrationSubmitRequest

SESSION_TTL_MINUTES = 15
TOKEN_BYTES = 32


# =======================================================================
# OTP + mock Aadhaar verification
# =======================================================================
def _new_session_id() -> str:
    return uuid.uuid4().hex


def start_otp_session(phone: str) -> tuple[str, str, int]:
    """Create a registration session and issue a mock OTP for `phone`.
    Returns (session_id, otp_code, ttl_seconds).
    """
    issued = idv.generate_otp()
    session_id = _new_session_id()
    expires_at = (datetime.utcnow() + timedelta(minutes=SESSION_TTL_MINUTES)).isoformat()

    with get_db() as db:
        db.execute(
            """INSERT INTO registration_sessions
               (session_id, phone, otp_code, otp_verified, otp_attempts,
                identity_verified, expires_at)
               VALUES (?, ?, ?, 0, 0, 0, ?)""",
            (session_id, phone, issued.code, expires_at),
        )
    return session_id, issued.code, issued.ttl_seconds


def _get_session(db, session_id: str):
    row = db.execute(
        "SELECT * FROM registration_sessions WHERE session_id = ?", (session_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Registration session not found or expired")
    if datetime.fromisoformat(row["expires_at"]) < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Registration session expired, please restart")
    return row


def verify_otp(session_id: str, otp_code: str) -> tuple[bool, str]:
    with get_db() as db:
        session = _get_session(db, session_id)

        if session["otp_verified"]:
            return True, "OTP already verified"

        if session["otp_attempts"] >= idv.MAX_OTP_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Too many OTP attempts, please restart registration")

        result = idv.check_otp(otp_code, session["otp_code"])

        if result.success:
            db.execute(
                "UPDATE registration_sessions SET otp_verified = 1, otp_code = NULL WHERE session_id = ?",
                (session_id,),
            )
            return True, "OTP verified"
        else:
            db.execute(
                "UPDATE registration_sessions SET otp_attempts = otp_attempts + 1 WHERE session_id = ?",
                (session_id,),
            )
            return False, result.reason or "OTP verification failed"


def verify_aadhaar(session_id: str, aadhaar_number: str, name: str, dob: str | None) -> tuple[bool, str]:
    with get_db() as db:
        session = _get_session(db, session_id)

        if not session["otp_verified"]:
            raise HTTPException(status_code=400, detail="Complete OTP verification before Aadhaar verification")

        result = idv.verify_aadhaar(aadhaar_number, name, dob)

        if result.success:
            db.execute(
                """UPDATE registration_sessions
                   SET identity_verified = 1, aadhaar_last4 = ?
                   WHERE session_id = ?""",
                (idv.mask_aadhaar(aadhaar_number), session_id),
            )
            return True, "Identity verified"
        else:
            return False, result.reason or "Aadhaar verification failed"


def require_fully_verified_session(session_id: str):
    """Used before allowing final submit. Returns the session row."""
    with get_db() as db:
        session = _get_session(db, session_id)
        if not session["otp_verified"]:
            raise HTTPException(status_code=400, detail="OTP not verified for this session")
        if not session["identity_verified"]:
            raise HTTPException(status_code=400, detail="Identity (Aadhaar) not verified for this session")
        return dict(session)


def close_session(session_id: str):
    with get_db() as db:
        db.execute("DELETE FROM registration_sessions WHERE session_id = ?", (session_id,))


# =======================================================================
# Guide personalization
# =======================================================================
CONTENT_BANK_PATH = Path(__file__).resolve().parent / "guide_content_bank.json"

_COMPASS_POINTS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
]

FLOOD_GUIDE_ID = "flood_protocol"
FIRST_AID_GUIDE_ID = "first_aid"

# Number of nearest shelters to include in the bundle
MAX_SHELTERS_IN_BUNDLE = 3


def _load_content_bank() -> dict:
    with open(CONTENT_BANK_PATH, "r") as f:
        return json.load(f)


def _bearing_to_compass(bearing_deg: float) -> str:
    idx = round(bearing_deg / 22.5) % 16
    return _COMPASS_POINTS[idx]


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _bearing_deg(lat1, lng1, lat2, lng2) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lng2 - lng1)
    x = math.sin(dlambda) * math.cos(phi2)
    y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    theta = math.atan2(x, y)
    return (math.degrees(theta) + 360) % 360


def select_disease_guides(diseases: list[str]) -> list[dict]:
    """Match the citizen's disease field(s) against the content bank's
    disease_tags. Case-insensitive, tolerant of underscores/spaces."""
    if not diseases:
        return []

    def normalize(s: str) -> str:
        return s.strip().lower().replace(" ", "_")

    wanted = {normalize(d) for d in diseases}
    bank = _load_content_bank()

    matched = []
    for guide in bank["guides"]:
        if guide["type"] != "disease":
            continue
        tags = {normalize(t) for t in guide.get("disease_tags", [])}
        if wanted & tags:
            matched.append(guide)
    return matched


def _get_fixed_guide(guide_id: str) -> dict:
    bank = _load_content_bank()
    for guide in bank["guides"]:
        if guide["guide_id"] == guide_id:
            return guide
    raise ValueError(f"Guide '{guide_id}' missing from content bank")


def get_compass_shelter_map(lat: float | None, lng: float | None) -> list[dict]:
    """Local shelter map is compass-based (bearing + distance from the
    citizen's location), NOT a routed/turn-by-turn path - this keeps it
    usable fully offline once cached by the Service Worker."""
    bank = _load_content_bank()
    shelters = bank["shelters"]

    if lat is None or lng is None:
        # No location on file - return the static shelter list unranked,
        # frontend can still show names/capacity without bearing/distance.
        return [
            {
                "shelter_id": s["shelter_id"],
                "name": s["name"],
                "bearing_deg": 0.0,
                "bearing_compass": "N/A",
                "distance_km": None,
                "capacity": s.get("capacity"),
            }
            for s in shelters[:MAX_SHELTERS_IN_BUNDLE]
        ]

    enriched = []
    for s in shelters:
        dist = _haversine_km(lat, lng, s["lat"], s["lng"])
        bearing = _bearing_deg(lat, lng, s["lat"], s["lng"])
        enriched.append(
            {
                "shelter_id": s["shelter_id"],
                "name": s["name"],
                "bearing_deg": round(bearing, 1),
                "bearing_compass": _bearing_to_compass(bearing),
                "distance_km": round(dist, 2),
                "capacity": s.get("capacity"),
            }
        )
    enriched.sort(key=lambda x: x["distance_km"])
    return enriched[:MAX_SHELTERS_IN_BUNDLE]


def build_guide_bundle(diseases: list[str], lat: float | None, lng: float | None) -> dict:
    """Assemble the full personalized bundle handed off to the frontend
    for Service Worker caching (guides + shelter map + a cache manifest
    of URLs to pre-cache for offline use)."""
    disease_guides = select_disease_guides(diseases)
    flood_guide = _get_fixed_guide(FLOOD_GUIDE_ID)
    first_aid_guide = _get_fixed_guide(FIRST_AID_GUIDE_ID)

    guides = [flood_guide, first_aid_guide, *disease_guides]
    shelter_map = get_compass_shelter_map(lat, lng)

    cache_manifest = [g["content_url"] for g in guides]

    return {
        "version": datetime.utcnow().strftime("%Y%m%d%H%M%S"),
        "generated_at": datetime.utcnow().isoformat(),
        "guides": guides,
        "shelter_map": shelter_map,
        "cache_manifest": cache_manifest,
    }


# =======================================================================
# Final submit: store profile + family roster, issue browser token
# =======================================================================
def _validate_profile(profile) -> None:
    if not profile.full_name or not profile.full_name.strip():
        raise HTTPException(status_code=422, detail="full_name is required")
    if not profile.phone or not profile.phone.strip():
        raise HTTPException(status_code=422, detail="phone is required")
    if profile.age is not None and (profile.age < 0 or profile.age > 130):
        raise HTTPException(status_code=422, detail="age is out of range")


def _validate_family_members(family_members) -> None:
    for i, m in enumerate(family_members):
        if not m.full_name or not m.full_name.strip():
            raise HTTPException(status_code=422, detail=f"family_members[{i}].full_name is required")
        if m.age is not None and (m.age < 0 or m.age > 130):
            raise HTTPException(status_code=422, detail=f"family_members[{i}].age is out of range")


def _issue_browser_token(db, citizen_id: int) -> str:
    token = secrets.token_urlsafe(TOKEN_BYTES)
    db.execute(
        "INSERT INTO browser_tokens (token, citizen_id) VALUES (?, ?)",
        (token, citizen_id),
    )
    return token


def submit_registration(req: RegistrationSubmitRequest) -> dict:
    # Registration must have completed OTP + mock-Aadhaar verification
    # for this session before we persist anything.
    session = require_fully_verified_session(req.session_id)

    profile = req.profile
    _validate_profile(profile)
    _validate_family_members(req.family_members)

    if profile.phone.strip() != session["phone"].strip():
        raise HTTPException(
            status_code=400,
            detail="Profile phone number does not match the verified session phone number",
        )

    with get_db() as db:
        cur = db.execute(
            """INSERT INTO citizens (
                full_name, age, gender, phone, blood_group, diseases,
                medical_conditions, home_location_lat, home_location_lng,
                current_location_lat, current_location_lng, address_text,
                identity_verified, aadhaar_last4
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            (
                profile.full_name.strip(),
                profile.age,
                profile.gender,
                profile.phone.strip(),
                profile.blood_group,
                json.dumps(profile.diseases),
                profile.medical_conditions,
                profile.home_location_lat,
                profile.home_location_lng,
                profile.current_location_lat,
                profile.current_location_lng,
                profile.address_text,
                session["aadhaar_last4"],
            ),
        )
        citizen_id = cur.lastrowid

        for m in req.family_members:
            db.execute(
                """INSERT INTO family_members (
                    citizen_id, full_name, age, gender, relation,
                    blood_group, diseases, medical_conditions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    citizen_id,
                    m.full_name.strip(),
                    m.age,
                    m.gender,
                    m.relation,
                    m.blood_group,
                    json.dumps(m.diseases),
                    m.medical_conditions,
                ),
            )

        browser_token = _issue_browser_token(db, citizen_id)

    # Registration session is single-use; close it now that the profile exists.
    close_session(req.session_id)

    bundle = build_guide_bundle(
        diseases=profile.diseases,
        lat=profile.current_location_lat or profile.home_location_lat,
        lng=profile.current_location_lng or profile.home_location_lng,
    )

    return {
        "citizen_id": citizen_id,
        "browser_token": browser_token,
        "guide_bundle": bundle,
    }


# =======================================================================
# SOS auto-fill lookup
# =======================================================================
def lookup_by_token(token: str | None) -> dict:
    """Never raises for a missing/unknown token - the SOS flow must work
    for unregistered citizens too. Returns {'found': False} in that case."""
    if not token:
        return {"found": False}

    with get_db() as db:
        row = db.execute(
            """SELECT c.* FROM browser_tokens bt
               JOIN citizens c ON c.citizen_id = bt.citizen_id
               WHERE bt.token = ?""",
            (token,),
        ).fetchone()

        if row is None:
            return {"found": False}

        db.execute(
            "UPDATE browser_tokens SET last_seen_at = datetime('now') WHERE token = ?",
            (token,),
        )

        family_rows = db.execute(
            "SELECT * FROM family_members WHERE citizen_id = ?",
            (row["citizen_id"],),
        ).fetchall()

    family_members = [
        {
            "full_name": fm["full_name"],
            "age": fm["age"],
            "gender": fm["gender"],
            "relation": fm["relation"],
            "blood_group": fm["blood_group"],
            "diseases": json.loads(fm["diseases"] or "[]"),
            "medical_conditions": fm["medical_conditions"],
        }
        for fm in family_rows
    ]

    return {
        "found": True,
        "citizen_id": row["citizen_id"],
        "full_name": row["full_name"],
        "gender": row["gender"],
        "blood_group": row["blood_group"],
        "diseases": json.loads(row["diseases"] or "[]"),
        "medical_conditions": row["medical_conditions"],
        "address_text": row["address_text"],
        "family_members": family_members,
    }
