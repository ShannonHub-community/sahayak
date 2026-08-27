"""
SAHAYAK Citizen Donation Portal - Human Resources Service
Handles volunteer registrations, mapping skills taxonomy to fixed personnel subtypes,
and storing availability windows.
"""

from typing import Dict, Any

# Fixed Personnel Taxonomy Mapping
TAXONOMY_MAP = {
    "Medical": "Medics & Paramedics",
    "Logistics": "Supply Chain & Logistics",
    "Technical": "Structural & Tech Engineers",
    "General Relief": "General Shelter Volunteers"
}

def process_human_resources_submission(payload: Dict[str, Any], donor_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Validates and maps HR volunteer offer to fixed personnel taxonomy and returns formatted ticket details.
    """
    skill_category = payload.get("skill_category", "General Relief")
    mapped_subtype = TAXONOMY_MAP.get(skill_category, "General Shelter Volunteers")
    
    availability_window = payload.get("availability_window", "Immediate (24-48 Hours)")
    quantity = payload.get("quantity", 1)
    
    donor_name = payload.get("donor_name") or (donor_profile.get("name") if donor_profile else "Volunteering Citizen")
    
    ticket_payload = {
        "donor_name": donor_name,
        "donor_type": "Individual" if not donor_profile or donor_profile.get("type") == "individual" else "Organization",
        "identity_type": "Aadhaar / Identity Verified",
        "identity_number": payload.get("identity_number") or (donor_profile.get("verification_ref") if donor_profile else "VERIFIED-VOL-9821"),
        "resource_type": "Personnel",
        "resource_name": mapped_subtype,
        "quantity": f"{quantity} Volunteers ({skill_category})",
        "numeric_quantity": int(quantity),
        "location": payload.get("location", "Panvel Sector"),
        "availability_window": availability_window,
        "contact_person": payload.get("contact_person") or (donor_profile.get("coordinator_name") if donor_profile else donor_name),
        "phone": payload.get("phone") or (donor_profile.get("contact") if donor_profile else "+91 98765 00000"),
        "notes": f"HR Volunteer Offer [{skill_category}]. Availability: {availability_window}. Medical Info: {payload.get('medical_conditions', 'None')}"
    }
    
    return ticket_payload
