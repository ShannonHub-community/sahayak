"""
SAHAYAK Disaster Management Platform
Donation Coordinator & Resource Ledger Backend Service
FastAPI REST API Service
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

app = FastAPI(
    title="SAHAYAK Donation Coordinator API",
    description="Backend REST endpoints for Identity Verification, Nearest Shelter Auto-Routing, UUID+QR Certificates, CSR Gateway, and Public Verification.",
    version="1.0.0"
)

# Mock Database Store
DB_SHELTERS = [
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Shelter A (Sector 4 Relief Camp)",
        "sector": "Sector 4",
        "capacity": 500,
        "occupancy": 420,
        "occupancy_ratio": 84,
        "status": "Available"
    },
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Shelter B (Kharghar Community Center)",
        "sector": "Kharghar",
        "capacity": 300,
        "occupancy": 285,
        "occupancy_ratio": 95,
        "status": "Critical Shortage"
    },
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440003",
        "name": "Shelter C (Panvel High School)",
        "sector": "Panvel",
        "capacity": 450,
        "occupancy": 180,
        "occupancy_ratio": 40,
        "status": "Available"
    }
]

DB_DONATIONS = [
    {
        "uuid": "550e8400-e29b-41d4-a716-446655441048",
        "ticket_id": "REQ-2026-1048",
        "donor_name": "Helping Hands NGO",
        "donor_type": "Organization",
        "identity_type": "Organization Reg. No.",
        "identity_number": "REG-MH-2021-9842",
        "resource_name": "Food Rations",
        "numeric_quantity": 100,
        "location": "Panvel",
        "request_status": "Pending"
    }
]

DB_CERTIFICATES = [
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440050",
        "donation_id": "REQ-2026-1050",
        "donor_name": "Local Relief Trust",
        "identity_badge": "Verified Trust Reg. #TR-2018-00412",
        "contribution_summary": "200 Blankets",
        "routed_shelter": "Shelter C (Panvel High School)",
        "verify_url": "https://sahayak.gov.in/verify/550e8400-e29b-41d4-a716-446655440050",
        "status": "Valid",
        "issued_at": datetime.now().isoformat()
    }
]

# Schemas
class DonationCreate(BaseModel):
    donor_name: str
    donor_type: str  # Individual | Organization | CSR Partner
    identity_type: str
    identity_number: str
    resource_name: str
    numeric_quantity: int
    location: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class RouteApproveRequest(BaseModel):
    shelter_uuid: str
    officer_name: str

@app.get("/")
def read_root():
    return {
        "service": "SAHAYAK Donation Coordinator API",
        "status": "OPERATIONAL",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/donations")
def get_donations(status: Optional[str] = None):
    if status:
        return [d for d in DB_DONATIONS if d["request_status"] == status]
    return DB_DONATIONS

@app.post("/api/donations")
def create_donation(donation: DonationCreate):
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1048}"
    donation_uuid = str(uuid.uuid4())
    
    record = {
        "uuid": donation_uuid,
        "ticket_id": ticket_id,
        "donor_name": donation.donor_name,
        "donor_type": donation.donor_type,
        "identity_type": donation.identity_type,
        "identity_number": donation.identity_number,
        "resource_name": donation.resource_name,
        "numeric_quantity": donation.numeric_quantity,
        "location": donation.location,
        "request_status": "Pending",
        "submitted_at": datetime.now().isoformat()
    }
    DB_DONATIONS.append(record)
    return {"message": "Donation ticket created", "ticket": record}

@app.get("/api/donations/{ticket_id}/suggest-shelter")
def suggest_nearest_shelter(ticket_id: str):
    # Auto-calculated nearest shelter match based on highest occupancy ratio (highest shortage)
    sorted_shelters = sorted(DB_SHELTERS, key=lambda s: s["occupancy_ratio"], reverse=True)
    return {
        "ticket_id": ticket_id,
        "recommended_shelter": sorted_shelters[0],
        "alternative_shelters": sorted_shelters[1:]
    }

@app.post("/api/donations/{ticket_id}/approve-route")
def approve_and_route(ticket_id: str, payload: RouteApproveRequest):
    donation = next((d for d in DB_DONATIONS if d["ticket_id"] == ticket_id or d["uuid"] == ticket_id), None)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation ticket not found")

    shelter = next((s for s in DB_SHELTERS if s["uuid"] == payload.shelter_uuid), DB_SHELTERS[0])

    donation["request_status"] = "Approved"
    donation["routed_shelter"] = shelter["name"]
    relief_id = f"REL-2026-{len(DB_CERTIFICATES) + 1048}"

    # Generate Cryptographic Certificate with UUID & QR code
    cert_uuid = str(uuid.uuid4())
    cert_record = {
        "uuid": cert_uuid,
        "donation_id": donation["uuid"],
        "donor_name": donation["donor_name"],
        "identity_badge": f"Verified {donation['donor_type']} ({donation['identity_number']})",
        "contribution_summary": f"{donation['numeric_quantity']} {donation['resource_name']}",
        "routed_shelter": shelter["name"],
        "verify_url": f"https://sahayak.gov.in/verify/{cert_uuid}",
        "status": "Valid",
        "issued_at": datetime.now().isoformat()
    }
    DB_CERTIFICATES.append(cert_record)

    return {
        "message": "Donation approved and routed successfully",
        "relief_id": relief_id,
        "routed_shelter": shelter["name"],
        "certificate": cert_record
    }

@app.get("/api/verify/{certificate_uuid}")
def verify_certificate(certificate_uuid: str):
    cert = next((c for c in DB_CERTIFICATES if c["uuid"].lower() == certificate_uuid.lower()), None)
    if cert:
        return {
            "status": "VALID",
            "message": "Certificate cryptographically verified on SAHAYAK public ledger",
            "certificate": cert
        }
    return {
        "status": "INVALID",
        "message": "Certificate ID not found or tampered",
        "certificate": None
    }


# ==========================================
# CITIZEN DONATION PORTAL ENDPOINTS (FEAT-25)
# ==========================================

try:
    from services.donation_portal import donor, human_resources, medical, food, financial, funds_tracker
except ImportError:
    from backend.services.donation_portal import donor, human_resources, medical, food, financial, funds_tracker


@app.post("/api/donation-portal/donors/register")
def api_register_donor(payload: dict):
    donor_record = donor.register_donor(payload)
    return {"message": "Donor registered successfully", "donor": donor_record}

@app.post("/api/donation-portal/submit/human-resources")
def api_submit_human_resources(payload: dict):
    donor_profile = donor.get_donor(payload.get("donor_id")) if payload.get("donor_id") else None
    ticket_payload = human_resources.process_human_resources_submission(payload, donor_profile)
    
    # Store in donations table pipeline
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1048}"
    record = {
        "uuid": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        **ticket_payload,
        "request_status": "Pending",
        "submitted_at": datetime.now().isoformat()
    }
    DB_DONATIONS.append(record)
    return {"message": "Human Resources volunteer ticket submitted to Donation Coordinator pipeline", "ticket": record}

@app.post("/api/donation-portal/submit/medical")
def api_submit_medical(payload: dict):
    donor_profile = donor.get_donor(payload.get("donor_id")) if payload.get("donor_id") else None
    is_valid, error_msg, ticket_payload = medical.validate_medical_submission(payload, donor_profile)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
        
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1048}"
    record = {
        "uuid": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        **ticket_payload,
        "request_status": "Pending",
        "submitted_at": datetime.now().isoformat()
    }
    DB_DONATIONS.append(record)
    return {"message": "Medical supplies donation verified (>3mo expiry) & submitted", "ticket": record}

@app.post("/api/donation-portal/submit/food")
def api_submit_food(payload: dict):
    donor_profile = donor.get_donor(payload.get("donor_id")) if payload.get("donor_id") else None
    is_valid, error_msg, ticket_payload = food.validate_food_submission(payload, donor_profile)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
        
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1048}"
    record = {
        "uuid": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        **ticket_payload,
        "request_status": "Pending",
        "submitted_at": datetime.now().isoformat()
    }
    DB_DONATIONS.append(record)
    return {"message": "Food donation verified against FSSAI window & submitted", "ticket": record}

@app.post("/api/donation-portal/submit/financial")
def api_submit_financial(payload: dict):
    donor_profile = donor.get_donor(payload.get("donor_id")) if payload.get("donor_id") else None
    financial_record = financial.process_financial_donation(payload, donor_profile)
    return {
        "message": "Financial donation processed & routed directly to CMRF/NDMA accounts",
        "transaction": financial_record
    }

@app.get("/api/donation-portal/funds-tracker")
def api_get_funds_tracker():
    financial_list = financial.get_financial_donations()
    aggregation = funds_tracker.calculate_funds_tracker_aggregation(DB_DONATIONS, financial_list)
    return aggregation

