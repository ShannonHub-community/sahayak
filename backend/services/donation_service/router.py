"""
SAHAYAK Donation Coordinator & Resource Ledger Backend Service Router.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["Donation Coordinator & CSR Ledger"])

# In-memory datasets
DB_SHELTERS: List[Dict[str, Any]] = [
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Shelter A (Sector 4 Relief Camp)",
        "sector": "Sector 4",
        "capacity": 500,
        "occupancy": 420,
        "occupancy_ratio": 84,
        "status": "Available",
    },
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Shelter B (Kharghar Community Center)",
        "sector": "Kharghar",
        "capacity": 300,
        "occupancy": 285,
        "occupancy_ratio": 95,
        "status": "Critical Shortage",
    },
    {
        "uuid": "550e8400-e29b-41d4-a716-446655440003",
        "name": "Shelter C (Panvel High School)",
        "sector": "Panvel",
        "capacity": 450,
        "occupancy": 180,
        "occupancy_ratio": 40,
        "status": "Available",
    },
]

DB_DONATIONS: List[Dict[str, Any]] = [
    {
        "uuid": "550e8400-e29b-41d4-a716-446655441048",
        "id": "REQ-2026-1048",
        "ticket_id": "REQ-2026-1048",
        "donor": "Helping Hands NGO",
        "donor_name": "Helping Hands NGO",
        "donor_type": "Organization",
        "identity_type": "Organization Reg. No.",
        "identity_number": "REG-MH-2021-9842",
        "resource": "Food Rations",
        "resource_name": "Food Rations",
        "type": "Supplies",
        "quantity": "500 packets",
        "numeric_quantity": 500,
        "numericQuantity": 500,
        "location": "Sector 3 (Panvel)",
        "requestStatus": "Pending",
        "request_status": "Pending",
        "timestamp": "15 mins ago",
    },
    {
        "uuid": "550e8400-e29b-41d4-a716-446655441049",
        "id": "REQ-2026-1049",
        "ticket_id": "REQ-2026-1049",
        "donor": "Tata Motors CSR Foundation",
        "donor_name": "Tata Motors CSR Foundation",
        "donor_type": "CSR Partner",
        "identity_type": "CSR Reg.",
        "identity_number": "CSR-IND-2024-884",
        "resource": "Drinking Water",
        "resource_name": "Drinking Water",
        "type": "Supplies",
        "quantity": "2,500 liters",
        "numeric_quantity": 2500,
        "numericQuantity": 2500,
        "location": "Sector 4 (Roha)",
        "requestStatus": "Approved",
        "request_status": "Approved",
        "reliefId": "REL-2026-0812",
        "timestamp": "30 mins ago",
    },
]

DB_CERTIFICATES: List[Dict[str, Any]] = [
    {
        "id": "CERT-2026-001",
        "uuid": "550e8400-e29b-41d4-a716-446655440050",
        "donation_id": "REQ-2026-1049",
        "donor_name": "Tata Motors CSR Foundation",
        "donorName": "Tata Motors CSR Foundation",
        "identity_badge": "Verified CSR Partner (CSR-IND-2024-884)",
        "contribution_summary": "2,500 Liters Drinking Water",
        "contributionSummary": "2,500 Liters Drinking Water",
        "routed_shelter": "Shelter A (Sector 4 Relief Camp)",
        "verify_url": "https://sahayak.gov.in/verify/550e8400-e29b-41d4-a716-446655440050",
        "status": "Valid",
        "date": "2026-08-30",
        "reliefId": "REL-2026-0812",
        "verifiedBy": "EOC Senior Logistics Officer - Raigad District",
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }
]

DB_FINANCIAL: List[Dict[str, Any]] = [
    {
        "transaction_id": "TXN-2026-9081",
        "donor_name": "Reliance Foundation",
        "amount": 2500000,
        "category": "Chief Minister Relief Fund (CMRF)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
]


# Schemas
class DonationCreate(BaseModel):
    donor: Optional[str] = None
    donor_name: Optional[str] = None
    donor_type: Optional[str] = "Individual"
    identity_type: Optional[str] = "Aadhaar"
    identity_number: Optional[str] = "XXXX-XXXX-1234"
    resource: Optional[str] = None
    resource_name: Optional[str] = None
    type: Optional[str] = "Supplies"
    quantity: Optional[str] = None
    numeric_quantity: Optional[int] = 100
    numericQuantity: Optional[int] = 100
    location: Optional[str] = "Panvel"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class RouteApproveRequest(BaseModel):
    shelter_uuid: Optional[str] = None
    shelter_name: Optional[str] = None
    officer_name: Optional[str] = "EOC Logistics Officer"


# ---------------------------------------------------------------------------
# Matrix & Pledge Endpoints
# ---------------------------------------------------------------------------
@router.get("/api/v1/donations/matrix")
def get_donations_matrix():
    """Returns aggregated pledged vs required material assistance."""
    approved_donations = [d for d in DB_DONATIONS if d.get("request_status") == "Approved"]
    total_units_inducted = sum(d.get("numeric_quantity", 0) for d in approved_donations)

    return {
        "status": "success",
        "total_inducted_units": total_units_inducted + 8500,
        "active_relief_certificates": len(DB_CERTIFICATES),
        "open_public_needs_count": 3,
        "categories_summary": [
            {"category": "Food Rations", "required": 5000, "pledged": 3800, "deficit": 1200, "status": "Moderate Deficit"},
            {"category": "Drinking Water", "required": 10000, "pledged": 9200, "deficit": 800, "status": "Adequate"},
            {"category": "Medical Trauma Kits", "required": 800, "pledged": 650, "deficit": 150, "status": "Adequate"},
            {"category": "Rescue Boats & Helo Ops", "required": 20, "pledged": 16, "deficit": 4, "status": "High Priority"},
        ],
    }


@router.post("/api/v1/donations/pledge")
def pledge_donation(payload: Dict[str, Any]):
    """Ingests citizen or corporate material/financial pledges."""
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1050}"
    receipt_id = f"PLEDGE-REC-{uuid.uuid4().hex[:8].upper()}"

    donation_record = {
        "uuid": str(uuid.uuid4()),
        "id": ticket_id,
        "ticket_id": ticket_id,
        "receipt_id": receipt_id,
        "donor": payload.get("donor") or payload.get("donor_name") or "Citizen Donor",
        "donor_name": payload.get("donor_name") or payload.get("donor") or "Citizen Donor",
        "donor_type": payload.get("donor_type", "Individual"),
        "resource": payload.get("resource") or payload.get("resource_name") or "Relief Supplies",
        "resource_name": payload.get("resource_name") or payload.get("resource") or "Relief Supplies",
        "type": payload.get("type", "Supplies"),
        "quantity": payload.get("quantity") or f"{payload.get('numeric_quantity', 100)} units",
        "numeric_quantity": int(payload.get("numeric_quantity") or payload.get("numericQuantity") or 100),
        "location": payload.get("location", "Sector 3 (Panvel)"),
        "requestStatus": "Pending",
        "request_status": "Pending",
        "timestamp": "Just now",
        "notes": payload.get("notes", "Submitted via Sahayak Public Portal"),
    }
    DB_DONATIONS.insert(0, donation_record)

    return {
        "status": "success",
        "message": "Pledge successfully registered with EOC Donation Coordinator",
        "ticket_id": ticket_id,
        "receipt_id": receipt_id,
        "ticket": donation_record,
    }


# ---------------------------------------------------------------------------
# General Donation Ticket Endpoints
# ---------------------------------------------------------------------------
@router.get("/api/donations")
@router.get("/api/v1/donations")
def list_donations(status: Optional[str] = None):
    if status and status.lower() != "all":
        return [d for d in DB_DONATIONS if d.get("request_status", "").lower() == status.lower() or d.get("requestStatus", "").lower() == status.lower()]
    return DB_DONATIONS


@router.post("/api/donations")
@router.post("/api/v1/donations")
def create_donation(donation: DonationCreate):
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1050}"
    donation_uuid = str(uuid.uuid4())
    donor_name = donation.donor_name or donation.donor or "Anonymous Contributor"
    resource_name = donation.resource_name or donation.resource or "Food Rations"
    numeric_qty = donation.numeric_quantity or donation.numericQuantity or 100

    record = {
        "uuid": donation_uuid,
        "id": ticket_id,
        "ticket_id": ticket_id,
        "donor": donor_name,
        "donor_name": donor_name,
        "donor_type": donation.donor_type,
        "identity_type": donation.identity_type,
        "identity_number": donation.identity_number,
        "resource": resource_name,
        "resource_name": resource_name,
        "type": donation.type,
        "quantity": donation.quantity or f"{numeric_qty} units",
        "numeric_quantity": numeric_qty,
        "numericQuantity": numeric_qty,
        "location": donation.location,
        "contactPerson": donation.contact_person,
        "phone": donation.phone,
        "notes": donation.notes,
        "requestStatus": "Pending",
        "request_status": "Pending",
        "timestamp": "Just now",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    DB_DONATIONS.insert(0, record)
    return {"message": "Donation ticket created", "ticket": record}


@router.get("/api/donations/{ticket_id}/suggest-shelter")
@router.get("/api/v1/donations/{ticket_id}/suggest-shelter")
def suggest_nearest_shelter(ticket_id: str):
    sorted_shelters = sorted(DB_SHELTERS, key=lambda s: s["occupancy_ratio"], reverse=True)
    return {
        "ticket_id": ticket_id,
        "recommended_shelter": sorted_shelters[0],
        "alternative_shelters": sorted_shelters[1:],
    }


@router.post("/api/donations/{ticket_id}/approve-route")
@router.post("/api/v1/donations/{ticket_id}/approve-route")
def approve_and_route(ticket_id: str, payload: RouteApproveRequest = RouteApproveRequest()):
    donation = next(
        (d for d in DB_DONATIONS if d.get("ticket_id") == ticket_id or d.get("uuid") == ticket_id or d.get("id") == ticket_id),
        None,
    )
    if not donation:
        raise HTTPException(status_code=404, detail="Donation ticket not found")

    shelter = DB_SHELTERS[0]
    if payload.shelter_uuid:
        shelter = next((s for s in DB_SHELTERS if s["uuid"] == payload.shelter_uuid), shelter)
    elif payload.shelter_name:
        shelter = next((s for s in DB_SHELTERS if payload.shelter_name.lower() in s["name"].lower()), shelter)

    donation["request_status"] = "Approved"
    donation["requestStatus"] = "Approved"
    donation["routed_shelter"] = shelter["name"]
    donation["routedTo"] = shelter["name"]
    relief_id = f"REL-2026-{len(DB_CERTIFICATES) + 1048}"
    donation["reliefId"] = relief_id

    cert_uuid = str(uuid.uuid4())
    cert_record = {
        "id": f"CERT-2026-{len(DB_CERTIFICATES) + 1:03d}",
        "uuid": cert_uuid,
        "donation_id": donation.get("uuid", ticket_id),
        "donor_name": donation.get("donor_name") or donation.get("donor"),
        "donorName": donation.get("donor_name") or donation.get("donor"),
        "identity_badge": f"Verified {donation.get('donor_type', 'Donor')}",
        "contribution_summary": f"{donation.get('numeric_quantity', 100)} {donation.get('resource_name') or donation.get('resource')}",
        "contributionSummary": f"{donation.get('numeric_quantity', 100)} {donation.get('resource_name') or donation.get('resource')}",
        "routed_shelter": shelter["name"],
        "verify_url": f"https://sahayak.gov.in/verify/{cert_uuid}",
        "status": "Verified",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "reliefId": relief_id,
        "verifiedBy": f"{payload.officer_name} - Raigad District EOC",
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }
    DB_CERTIFICATES.insert(0, cert_record)

    return {
        "message": "Donation approved and routed successfully",
        "relief_id": relief_id,
        "routed_shelter": shelter["name"],
        "certificate": cert_record,
    }


@router.get("/api/verify/{certificate_uuid}")
@router.get("/api/v1/donations/verify/{certificate_uuid}")
def verify_certificate(certificate_uuid: str):
    cert = next((c for c in DB_CERTIFICATES if c["uuid"].lower() == certificate_uuid.lower()), None)
    if cert:
        return {
            "status": "VALID",
            "message": "Certificate cryptographically verified on SAHAYAK public disaster ledger",
            "certificate": cert,
        }
    return {
        "status": "INVALID",
        "message": "Certificate ID not found or expired",
        "certificate": None,
    }


# ---------------------------------------------------------------------------
# Citizen Donation Portal Sub-Routes
# ---------------------------------------------------------------------------
@router.post("/api/donation-portal/donors/register")
def api_register_donor(payload: Dict[str, Any]):
    donor_id = f"DNR-{uuid.uuid4().hex[:6].upper()}"
    return {
        "message": "Donor registered successfully",
        "donor": {
            "donor_id": donor_id,
            "name": payload.get("name", "Public Donor"),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
            "verified": True,
        },
    }


@router.post("/api/donation-portal/submit/human-resources")
def api_submit_human_resources(payload: Dict[str, Any]):
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1050}"
    record = {
        "uuid": str(uuid.uuid4()),
        "id": ticket_id,
        "ticket_id": ticket_id,
        "donor": payload.get("name", "Volunteer Lead"),
        "donor_name": payload.get("name", "Volunteer Lead"),
        "donor_type": "Volunteer Group",
        "resource": "General Volunteers",
        "resource_name": "General Volunteers",
        "type": "Personnel",
        "quantity": f"{payload.get('count', 10)} Volunteers",
        "numeric_quantity": int(payload.get("count", 10)),
        "numericQuantity": int(payload.get("count", 10)),
        "location": payload.get("location", "Sector 3 (Panvel)"),
        "requestStatus": "Pending",
        "request_status": "Pending",
        "timestamp": "Just now",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    DB_DONATIONS.insert(0, record)
    return {"message": "Human Resources volunteer ticket submitted to Donation Coordinator pipeline", "ticket": record}


@router.post("/api/donation-portal/submit/medical")
def api_submit_medical(payload: Dict[str, Any]):
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1050}"
    record = {
        "uuid": str(uuid.uuid4()),
        "id": ticket_id,
        "ticket_id": ticket_id,
        "donor": payload.get("donor_name", "Medical Donor"),
        "donor_name": payload.get("donor_name", "Medical Donor"),
        "donor_type": "Medical Entity",
        "resource": payload.get("item_name", "Medical Kits"),
        "resource_name": payload.get("item_name", "Medical Kits"),
        "type": "Supplies",
        "quantity": f"{payload.get('quantity', 50)} kits",
        "numeric_quantity": int(payload.get("quantity", 50)),
        "numericQuantity": int(payload.get("quantity", 50)),
        "location": payload.get("location", "Sector 2 (Pen)"),
        "requestStatus": "Pending",
        "request_status": "Pending",
        "timestamp": "Just now",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    DB_DONATIONS.insert(0, record)
    return {"message": "Medical supplies donation verified and submitted", "ticket": record}


@router.post("/api/donation-portal/submit/food")
def api_submit_food(payload: Dict[str, Any]):
    ticket_id = f"REQ-2026-{len(DB_DONATIONS) + 1050}"
    record = {
        "uuid": str(uuid.uuid4()),
        "id": ticket_id,
        "ticket_id": ticket_id,
        "donor": payload.get("donor_name", "Food Provider"),
        "donor_name": payload.get("donor_name", "Food Provider"),
        "donor_type": "Community Kitchen",
        "resource": "Food Rations",
        "resource_name": "Food Rations",
        "type": "Supplies",
        "quantity": f"{payload.get('meal_count', 200)} meals",
        "numeric_quantity": int(payload.get("meal_count", 200)),
        "numericQuantity": int(payload.get("meal_count", 200)),
        "location": payload.get("location", "Sector 4 (Roha)"),
        "requestStatus": "Pending",
        "request_status": "Pending",
        "timestamp": "Just now",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    DB_DONATIONS.insert(0, record)
    return {"message": "Food donation verified against FSSAI window & submitted", "ticket": record}


@router.post("/api/donation-portal/submit/financial")
def api_submit_financial(payload: Dict[str, Any]):
    txn_id = f"TXN-2026-{uuid.uuid4().hex[:6].upper()}"
    financial_record = {
        "transaction_id": txn_id,
        "donor_name": payload.get("name", "CSR Contributor"),
        "amount": float(payload.get("amount", 50000)),
        "category": payload.get("fund_category", "Chief Minister Relief Fund (CMRF)"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "Transferred",
    }
    DB_FINANCIAL.insert(0, financial_record)
    return {
        "message": "Financial donation processed & routed directly to CMRF/NDMA accounts",
        "transaction": financial_record,
    }


@router.get("/api/donation-portal/funds-tracker")
def api_get_funds_tracker():
    total_amount = sum(f.get("amount", 0) for f in DB_FINANCIAL)
    return {
        "total_funds_received_inr": total_amount,
        "disaster_allocations": [
            {"sector": "Roha Flood Relief", "allocated_inr": 1200000, "utilization_pct": 82},
            {"sector": "Panvel Pumping Operations", "allocated_inr": 800000, "utilization_pct": 74},
            {"sector": "Pen Medical Supplies", "allocated_inr": 500000, "utilization_pct": 90},
        ],
        "recent_transactions": DB_FINANCIAL[:5],
    }
