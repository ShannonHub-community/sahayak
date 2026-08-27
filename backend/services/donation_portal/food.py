"""
SAHAYAK Citizen Donation Portal - Food & Meals Service
Enforces FSSAI 4-6 hour shelf-life standard for cooked food donations.
Encourages dry rations.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

def validate_food_submission(payload: Dict[str, Any], donor_profile: Dict[str, Any] = None) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates food donation payload.
    For cooked meals, checks prep_timestamp against current time. Rejects if prep time exceeds 6 hours.
    Returns (is_valid, error_message, formatted_ticket_payload)
    """
    food_category = payload.get("food_category", "Cooked Meals") # "Cooked Meals" or "Dry Rations"

    prep_timestamp_str = payload.get("prep_timestamp")
    
    if food_category == "Cooked Meals":
        if not prep_timestamp_str:
            return False, "Preparation timestamp is required for cooked meals.", {}

        try:
            prep_dt = datetime.fromisoformat(prep_timestamp_str.replace("Z", "+00:00"))
        except ValueError:
            return False, "Invalid ISO timestamp for preparation time.", {}

        now = datetime.now()
        # Make timestamps offset-naive for simple comparison
        if prep_dt.tzinfo is not None:
            prep_dt = prep_dt.replace(tzinfo=None)

        elapsed_hours = (now - prep_dt).total_seconds() / 3600.0

        if elapsed_hours > 6.0:
            return False, (
                f"REJECTED: Cooked food was prepared {elapsed_hours:.1f} hours ago. "
                "FSSAI safety standards require cooked meals to reach shelters within 4-6 hours of preparation. "
                "Please consider donating dry rations instead."
            ), {}

    quantity = payload.get("numeric_quantity", 100)
    resource_name = payload.get("resource_name", "Food Rations" if food_category == "Dry Rations" else "Fresh Cooked Meals")
    donor_name = payload.get("donor_name") or (donor_profile.get("name") if donor_profile else "Food Relief Donor")

    ticket_payload = {
        "donor_name": donor_name,
        "donor_type": "Organization" if donor_profile and donor_profile.get("type") == "organization" else "Individual",
        "identity_type": "FSSAI / Food Reg / Identity",
        "identity_number": payload.get("identity_number") or (donor_profile.get("verification_ref") if donor_profile else "FOOD-SAFE-901"),
        "resource_type": "Supplies",
        "resource_name": resource_name,
        "quantity": f"{quantity} Packets ({food_category})",
        "numeric_quantity": int(quantity),
        "location": payload.get("location", "Kharghar Sector"),
        "prep_timestamp": prep_timestamp_str if food_category == "Cooked Meals" else None,
        "contact_person": payload.get("contact_person") or donor_name,
        "phone": payload.get("phone") or "+91 98765 22222",
        "notes": f"Food Offer: {food_category} ({resource_name}). Prep Time: {prep_timestamp_str or 'Dry Ration'}. FSSAI Window Verified."
    }

    return True, "", ticket_payload
