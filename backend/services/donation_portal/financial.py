"""
SAHAYAK Citizen Donation Portal - Financial Assistance Service
Processes parallel financial donations routing directly to CMRF/NDMA government relief accounts.
Bypasses resource-matching pipeline entirely and issues instant 80G tax certificates.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List

DB_FINANCIAL_DONATIONS: List[Dict[str, Any]] = [
    {
        "id": "550e8400-e29b-41d4-a716-446655448001",
        "donor_id": "550e8400-e29b-41d4-a716-446655440099",
        "donor_name": "Rajesh Kumar",
        "pan_number": "ABCDE1234F",
        "amount": 25000.0,
        "payment_status": "Completed (Routed to CMRF)",
        "destination_account": "Chief Minister Relief Fund (CMRF)",
        "certificate_80g_id": "80G-2026-FIN-1092",
        "verify_url": "https://sahayak.gov.in/verify/80G-2026-FIN-1092",
        "created_at": datetime.now().isoformat()
    }
]

def process_financial_donation(payload: Dict[str, Any], donor_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Executes mock payment processing, records financial donation,
    and generates an instant 80G tax exemption certificate.
    """
    donation_id = str(uuid.uuid4())
    cert_80g_id = f"80G-2026-FIN-{len(DB_FINANCIAL_DONATIONS) + 1093}"
    cert_uuid = str(uuid.uuid4())
    
    donor_name = payload.get("donor_name") or (donor_profile.get("name") if donor_profile else "Generous Citizen")
    pan_number = payload.get("pan_number", "ABCDE1234F").upper()
    amount = float(payload.get("amount", 10000.0))
    target_account = payload.get("target_account", "Chief Minister Relief Fund (CMRF)")
    
    financial_record = {
        "id": donation_id,
        "donor_id": donor_profile.get("id") if donor_profile else None,
        "donor_name": donor_name,
        "pan_number": pan_number,
        "amount": amount,
        "payment_status": "Completed (Routed to Govt Relief Account)",
        "destination_account": target_account,
        "certificate_80g_id": cert_80g_id,
        "certificate_uuid": cert_uuid,
        "verify_url": f"https://sahayak.gov.in/verify/{cert_uuid}",
        "issued_at": datetime.now().isoformat(),
        "section_80g_details": {
            "deduction_percentage": "50% under Section 80G",
            "issuing_authority": "Govt of Maharashtra Emergency Relief Fund",
            "pan_of_donee": "AAATC9081E"
        }
    }
    
    DB_FINANCIAL_DONATIONS.append(financial_record)
    return financial_record

def get_financial_donations() -> List[Dict[str, Any]]:
    """Returns list of financial donations."""
    return DB_FINANCIAL_DONATIONS
