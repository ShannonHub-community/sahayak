"""Pydantic models for the Registration Service API surface."""
from typing import Optional
from pydantic import BaseModel, Field


# ---------- OTP ----------
class OtpSendRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class OtpSendResponse(BaseModel):
    session_id: str
    ttl_seconds: int
    dev_otp: Optional[str] = None  # only populated outside production, for testing


class OtpVerifyRequest(BaseModel):
    session_id: str
    otp_code: str


class OtpVerifyResponse(BaseModel):
    verified: bool
    message: str


# ---------- Mock Aadhaar ----------
class AadhaarVerifyRequest(BaseModel):
    session_id: str
    aadhaar_number: str = Field(..., description="12-digit mock Aadhaar number")
    name: str
    dob: Optional[str] = None


class AadhaarVerifyResponse(BaseModel):
    verified: bool
    message: str


# ---------- Final registration submit ----------
class FamilyMemberIn(BaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    relation: Optional[str] = None
    blood_group: Optional[str] = None
    diseases: list[str] = Field(default_factory=list)
    medical_conditions: Optional[str] = None


class ProfileIn(BaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: str
    blood_group: Optional[str] = None
    diseases: list[str] = Field(default_factory=list)
    medical_conditions: Optional[str] = None
    home_location_lat: Optional[float] = None
    home_location_lng: Optional[float] = None
    current_location_lat: Optional[float] = None
    current_location_lng: Optional[float] = None
    address_text: Optional[str] = None


class RegistrationSubmitRequest(BaseModel):
    session_id: str
    profile: ProfileIn
    family_members: list[FamilyMemberIn] = Field(default_factory=list)


class GuideRef(BaseModel):
    guide_id: str
    title: str
    type: str
    content_url: str
    disease_tags: list[str] = Field(default_factory=list)


class ShelterRef(BaseModel):
    shelter_id: str
    name: str
    bearing_deg: float
    bearing_compass: str  # e.g. "NE"
    distance_km: float
    capacity: Optional[int] = None


class GuideBundle(BaseModel):
    version: str
    generated_at: str
    guides: list[GuideRef]
    shelter_map: list[ShelterRef]
    cache_manifest: list[str]  # list of content_urls the Service Worker should cache


class RegistrationSubmitResponse(BaseModel):
    citizen_id: int
    browser_token: str
    guide_bundle: GuideBundle


# ---------- SOS auto-fill ----------
class FamilyMemberOut(BaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    relation: Optional[str] = None
    blood_group: Optional[str] = None
    diseases: list[str] = Field(default_factory=list)
    medical_conditions: Optional[str] = None


class AutofillResponse(BaseModel):
    found: bool
    citizen_id: Optional[int] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    diseases: list[str] = Field(default_factory=list)
    medical_conditions: Optional[str] = None
    address_text: Optional[str] = None
    family_members: list[FamilyMemberOut] = Field(default_factory=list)
