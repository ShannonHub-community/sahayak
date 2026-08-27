"""
Registration Service API routes.

    /api/registration/otp/send
    /api/registration/otp/verify
    /api/registration/aadhaar/verify
    /api/registration/submit
    /api/sos/autofill
"""
import os

from fastapi import APIRouter, Cookie, Header, Request, Response

import service
from schemas import (
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
sos_router = APIRouter(prefix="/api/sos", tags=["sos"])

BROWSER_TOKEN_COOKIE = "sahayak_id"
IS_PROD = os.getenv("SAHAYAK_ENV", "development") == "production"


# ---------------------------------------------------------------------
# Step 1: OTP
# ---------------------------------------------------------------------
@registration_router.post("/otp/send", response_model=OtpSendResponse)
def send_otp(req: OtpSendRequest):
    session_id, otp_code, ttl = service.start_otp_session(req.phone)
    return OtpSendResponse(
        session_id=session_id,
        ttl_seconds=ttl,
        # Only surfaced outside production, since there's no real SMS gateway
        # wired up yet - lets the frontend/QA complete the flow end to end.
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

    # Persist the browser identifier as an httpOnly cookie for same-origin
    # deployments; also returned in the JSON body so a Service-Worker/SPA
    # frontend can store it itself (e.g. IndexedDB) for fully offline use.
    response.set_cookie(
        key=BROWSER_TOKEN_COOKIE,
        value=result["browser_token"],
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        max_age=60 * 60 * 24 * 365,  # 1 year
    )

    return result


# ---------------------------------------------------------------------
# SOS tab auto-fill lookup
# ---------------------------------------------------------------------
@sos_router.get("/autofill", response_model=AutofillResponse)
def sos_autofill(
    request: Request,
    sahayak_id: str | None = Cookie(default=None),
    x_sahayak_token: str | None = Header(default=None),
):
    # Accept the identifier from a cookie (normal browser flow) or an
    # explicit header (Service Worker / offline-cached SPA reading the
    # token out of IndexedDB) - whichever is present.
    token = sahayak_id or x_sahayak_token
    result = service.lookup_by_token(token)
    return result
