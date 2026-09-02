"""Pydantic models for the SOS submit endpoint.

Field names mirror the frontend's `SOSPayload`/`SOSResponse` TypeScript
interfaces (src/types/sos.ts) exactly, so no field-renaming/adapter layer is
needed on the frontend side.
"""
from typing import Optional
from pydantic import BaseModel, Field


class SOSLocationIn(BaseModel):
    lat: float
    lng: float


class SOSSubmitRequest(BaseModel):
    citizen_id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    pax_count: int = Field(..., ge=1)
    medical_emergency: bool = False
    medical_condition: Optional[str] = None
    includes_infants: bool = False
    includes_elderly: bool = False
    location: SOSLocationIn
    landmark: Optional[str] = None
    transmission_method: str = "internet"
    browser_session_id: Optional[str] = None


class NearestShelterOut(BaseModel):
    name: str
    distance: str
    bearing: float
    cardinal: str
    coordinates: Optional[dict] = None
    contact: Optional[str] = None


class SOSSubmitResponse(BaseModel):
    status: str  # 'success' | 'queued' | 'error'
    report_id: str
    message: str
    nearest_shelter: Optional[NearestShelterOut] = None
    timestamp: str
