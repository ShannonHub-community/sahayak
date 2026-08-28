"""
Mock identity verification helpers used by the registration service.

No real SMS gateway or UIDAI integration is wired up yet - this issues
predictable/mock OTPs and does basic format-only Aadhaar validation so the
end-to-end registration flow can be exercised in development/demo.
"""
import random
import re
from dataclasses import dataclass
from typing import Optional

MAX_OTP_ATTEMPTS = 5
OTP_TTL_SECONDS = 5 * 60
OTP_LENGTH = 6

_AADHAAR_RE = re.compile(r"^[2-9]\d{11}$")  # 12 digits, cannot start with 0/1 per UIDAI format


@dataclass
class IssuedOtp:
    code: str
    ttl_seconds: int


@dataclass
class VerificationResult:
    success: bool
    reason: Optional[str] = None


def generate_otp() -> IssuedOtp:
    code = f"{random.randint(0, 10 ** OTP_LENGTH - 1):0{OTP_LENGTH}d}"
    return IssuedOtp(code=code, ttl_seconds=OTP_TTL_SECONDS)


def check_otp(submitted_code: str, expected_code: Optional[str]) -> VerificationResult:
    if not expected_code:
        return VerificationResult(success=False, reason="OTP already used or session invalid")
    if submitted_code.strip() == expected_code.strip():
        return VerificationResult(success=True)
    return VerificationResult(success=False, reason="Incorrect OTP code")


def verify_aadhaar(aadhaar_number: str, name: str, dob: Optional[str]) -> VerificationResult:
    digits = re.sub(r"\D", "", aadhaar_number or "")
    if not _AADHAAR_RE.match(digits):
        return VerificationResult(
            success=False,
            reason="Aadhaar number must be 12 digits and cannot start with 0 or 1",
        )
    if not name or not name.strip():
        return VerificationResult(success=False, reason="Name is required for Aadhaar demographic match")
    # Mock demographic match - always succeeds once format checks pass.
    return VerificationResult(success=True)


def mask_aadhaar(aadhaar_number: str) -> str:
    digits = re.sub(r"\D", "", aadhaar_number or "")
    return digits[-4:] if len(digits) >= 4 else digits
