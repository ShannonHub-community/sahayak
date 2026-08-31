"""
Registration & Citizen Service API routes.

    POST /api/register
    POST /api/citizen/register
    GET  /api/citizen/lookup
    POST /api/registration/otp/send
    POST /api/registration/otp/verify
    POST /api/registration/aadhaar/verify
    POST /api/registration/submit
    GET  /api/sos/autofill
"""
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Cookie, Header, Query, Request, Response
from pydantic import BaseModel, Field

from services.registration_service import service
from services.registration_service.schemas import (
    AadhaarVerifyRequest,
    AadhaarVerifyResponse,
    AutofillResponse,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
    RegistrationSubmitRequest,
    RegistrationSubmitResponse,
)

registration_router = APIRouter(prefix="/api/registration", tags=["registration"])
citizen_router = APIRouter(tags=["citizen"])
sos_autofill_router = APIRouter(prefix="/api/sos", tags=["sos"])

BROWSER_TOKEN_COOKIE = "sahayak_id"
IS_PROD = os.getenv("SAHAYAK_ENV", "development") == "production"

# In-memory backup store for citizen profiles
CITIZEN_CACHE: Dict[str, Dict[str, Any]] = {}


class DirectCitizenPayload(BaseModel):
    name: str
    phone: str
    gender: Optional[str] = "Prefer not to say"
    age: Optional[int] = 30
    blood_group: Optional[str] = "Unknown"
    medical_conditions: Optional[str] = None
    long_term_diseases: List[str] = Field(default_factory=list)
    family_members: List[Dict[str, Any]] = Field(default_factory=list)
    home_location: Optional[Dict[str, Any]] = None
    work_location: Optional[Dict[str, Any]] = None
    bluetooth_enabled: Optional[bool] = True
    citizen_id: Optional[str] = None
    browser_identifier: Optional[str] = None


# ---------------------------------------------------------------------
# Direct Citizen Pre-Registration Endpoint
# ---------------------------------------------------------------------
@citizen_router.post("/api/register")
@citizen_router.post("/api/citizen/register")
@citizen_router.post("/api/v1/citizen/register")
def register_citizen_direct(payload: Dict[str, Any], response: Response):
    """
    Ingests citizen pre-registration payload from the frontend Wizard,
    generates persistent identifiers, and provisions emergency guide bundles.
    """
    unique_suffix = uuid.uuid4().hex[:6].upper()
    citizen_id = payload.get("citizen_id") or f"CIT-IND-{uuid.uuid4().hex[:6].upper()}-{unique_suffix}"
    browser_id = payload.get("browser_identifier") or f"BID-IND-{uuid.uuid4().hex[:8]}"

    # Store profile in cache
    profile = {
        "citizen_id": citizen_id,
        "name": payload.get("name", "Citizen"),
        "phone": payload.get("phone", ""),
        "gender": payload.get("gender", "Other"),
        "age": payload.get("age", 30),
        "blood_group": payload.get("blood_group", "Unknown"),
        "medical_conditions": ", ".join(payload.get("long_term_diseases", [])) if isinstance(payload.get("long_term_diseases"), list) else "",
        "long_term_diseases": payload.get("long_term_diseases", []),
        "family_members_count": len(payload.get("family_members", [])) + 1,
        "family_members": payload.get("family_members", []),
        "home_location": payload.get("home_location"),
        "work_location": payload.get("work_location"),
        "bluetooth_enabled": payload.get("bluetooth_enabled", True),
        "ble_peer_id": str(uuid.uuid4()),
    }
    CITIZEN_CACHE[browser_id] = profile
    if profile["phone"]:
        CITIZEN_CACHE[profile["phone"]] = profile

    # Generate offline guide bundle
    guide_bundle = {
        "version": "2026.1",
        "first_aid_guide": {
            "title": "Emergency First-Aid Protocol (NDMA Standard)",
            "steps": [
                "Direct pressure on active bleeding with clean cloth for 10 minutes.",
                "Immobilize suspected fractures with rigid splint.",
                "Keep hypothermic patients warm and elevated above flood water.",
                "Do not give oral fluids to unconscious individuals.",
            ],
        },
        "flood_protocol_guide": {
            "title": "Flood Evacuation & High-Ground Routing Protocol",
            "steps": [
                "Immediately switch off main electricity MCB and LPG gas cylinder.",
                "Move to top floor with drinking water, medicines, and identification.",
                "Never walk through moving water deeper than knee height.",
                "Signal rescue drones with bright cloth or phone flashlight SOS.",
            ],
        },
        "local_shelters": [
            {
                "name": "Pillai College of Engineering Emergency Shelter",
                "distance": "1.2 km",
                "cardinal": "NE",
                "lat": 18.9902,
                "lng": 73.1276,
            },
            {
                "name": "Municipal High School Relief Camp",
                "distance": "1.8 km",
                "cardinal": "NW",
                "lat": 18.9856,
                "lng": 73.1189,
            },
        ],
    }

    # Set cookie
    response.set_cookie(
        key=BROWSER_TOKEN_COOKIE,
        value=browser_id,
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        max_age=60 * 60 * 24 * 365,
    )

    return {
        "status": "success",
        "citizen_id": citizen_id,
        "browser_identifier": browser_id,
        "ble_peer_id": profile["ble_peer_id"],
        "message": "Citizen pre-registration completed successfully. Offline emergency pack provisioned.",
        "guide_bundle": guide_bundle,
    }


@citizen_router.get("/api/citizen/lookup")
@citizen_router.get("/api/v1/citizen/lookup")
def lookup_citizen(
    browser_id: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
):
    """
    Looks up a cached citizen profile for automatic SOS form pre-population.
    """
    if browser_id and browser_id in CITIZEN_CACHE:
        return CITIZEN_CACHE[browser_id]
    if phone and phone in CITIZEN_CACHE:
        return CITIZEN_CACHE[phone]
    return {}


# ---------------------------------------------------------------------
# Step 1: OTP
# ---------------------------------------------------------------------
@registration_router.post("/otp/send", response_model=OtpSendResponse)
def send_otp(req: OtpSendRequest):
    session_id, otp_code, ttl = service.start_otp_session(req.phone)
    return OtpSendResponse(
        session_id=session_id,
        ttl_seconds=ttl,
        dev_otp=None if IS_PROD else otp_code,
    )


@registration_router.post("/otp/verify", response_model=OtpVerifyResponse)
def verify_otp(req: OtpVerifyRequest):
    success, message = service.verify_otp(req.session_id, req.otp_code)
    return OtpVerifyResponse(verified=success, message=message)


# ---------------------------------------------------------------------
# Step 2: Mock Aadhaar
# ---------------------------------------------------------------------
@registration_router.post("/aadhaar/verify", response_model=AadhaarVerifyResponse)
def verify_aadhaar(req: AadhaarVerifyRequest):
    success, message = service.verify_aadhaar(req.session_id, req.aadhaar_number, req.name, req.dob)
    return AadhaarVerifyResponse(verified=success, message=message)


# ---------------------------------------------------------------------
# Step 3: Final submit (profile + family roster + token + guide bundle)
# ---------------------------------------------------------------------
@registration_router.post("/submit", response_model=RegistrationSubmitResponse)
def submit_registration(req: RegistrationSubmitRequest, response: Response):
    result = service.submit_registration(req)

    response.set_cookie(
        key=BROWSER_TOKEN_COOKIE,
        value=result["browser_token"],
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        max_age=60 * 60 * 24 * 365,
    )

    return result


# ---------------------------------------------------------------------
# SOS tab auto-fill lookup
# ---------------------------------------------------------------------
@sos_autofill_router.get("/autofill", response_model=AutofillResponse)
def sos_autofill(
    request: Request,
    sahayak_id: str | None = Cookie(default=None),
    x_sahayak_token: str | None = Header(default=None),
):
    token = sahayak_id or x_sahayak_token
    result = service.lookup_by_token(token)
    return result
