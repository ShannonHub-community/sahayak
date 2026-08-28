"""
SAHAYAK Citizen Donation Portal - Medical Supplies Service
Enforces strict medical item validation including the 3-month (90-day) expiry rule.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

def validate_medical_submission(payload: Dict[str, Any], donor_profile: Dict[str, Any] = None) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates medical donation payload.
    Rejects any medication expiring within 3 months (90 days) from current date.
    Returns (is_valid, error_message, formatted_ticket_payload)
    """
    expiry_date_str = payload.get("expiry_date")
    if not expiry_date_str:
        return False, "Expiry date is required for medical donations.", {}

    try:
        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
    except ValueError:
        return False, "Invalid expiry date format. Expected YYYY-MM-DD.", {}

    today = datetime.now().date()
    min_valid_date = today + timedelta(days=90)  # 3 months rule

    if expiry_date < min_valid_date:
        days_left = (expiry_date - today).days
        return False, (
            f"REJECTED: Medication/supplies expire on {expiry_date_str} (in {days_left} days). "
            f"SAHAYAK safety policy requires all medical supplies to have at least 3 months (90 days) shelf life remaining."
        ), {}

    quantity = payload.get("numeric_quantity", 100)
    resource_name = payload.get("resource_name", "Medical Kits")
    donor_name = payload.get("donor_name") or (donor_profile.get("name") if donor_profile else "Medical Donor")

    ticket_payload = {
        "donor_name": donor_name,
        "donor_type": "Organization" if donor_profile and donor_profile.get("type") == "organization" else "Individual",
        "identity_type": "Medical Verification / NGO Reg",
        "identity_number": payload.get("identity_number") or (donor_profile.get("verification_ref") if donor_profile else "MED-VERIFIED-771"),
        "resource_type": "Supplies",
        "resource_name": resource_name,
        "quantity": f"{quantity} units ({payload.get('item_condition', 'Sealed/New')})",
        "numeric_quantity": int(quantity),
        "location": payload.get("location", "Sector 4"),
        "expiry_date": expiry_date_str,
        "contact_person": payload.get("contact_person") or donor_name,
        "phone": payload.get("phone") or "+91 98765 11111",
        "notes": f"Medical Offer: {resource_name}. Verified Expiry Date: {expiry_date_str} (>3 months remaining). Condition: {payload.get('item_condition', 'Sealed')}"
    }

    return True, "", ticket_payload
