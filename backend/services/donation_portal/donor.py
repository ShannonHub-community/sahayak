"""
SAHAYAK Citizen Donation Portal - Donor Service
Handles Donor Registration (Individual vs Organization) and Mock Identity/Org Verification.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# In-Memory Store for Donors (Mirrors DB Table 'donors')
DB_DONORS: Dict[str, Dict[str, Any]] = {}

def register_donor(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Registers a donor (individual or organization) and executes mock identity verification.
    """
    donor_id = str(uuid.uuid4())
    donor_type = payload.get("type", "individual").lower()
    
    # Mock identity/org verification logic
    ref = payload.get("verification_ref", "AADHAAR-MOCK-9988")
    verification_status = "verified" if ref else "pending"
    
    donor_record = {
        "id": donor_id,
        "type": donor_type,
        "name": payload.get("name", "Anonymous Donor"),
        "contact": payload.get("contact", "+91 98765 43210"),
        "verification_ref": ref,
        "verification_status": verification_status,
        "created_at": datetime.now().isoformat()
    }
    
    if donor_type == "individual":
        donor_record.update({
            "age": payload.get("age"),
            "gender": payload.get("gender"),
            "blood_group": payload.get("blood_group"),
            "medical_conditions": payload.get("medical_conditions", "None disclosed"),
            "photo_url": payload.get("photo_url", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
        })
    else:  # organization
        donor_record.update({
            "head_owner_name": payload.get("head_owner_name"),
            "coordinator_name": payload.get("coordinator_name"),
            "coordinator_contact": payload.get("coordinator_contact"),
            "org_location": payload.get("org_location", "Mumbai Region")
        })

    DB_DONORS[donor_id] = donor_record
    return donor_record

def get_donor(donor_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves donor profile by ID."""
    return DB_DONORS.get(donor_id)

def list_donors() -> list:
    """Lists all registered donors."""
    return list(DB_DONORS.values())
