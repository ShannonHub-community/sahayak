from enum import Enum
from typing import Optional, Literal, Dict, List, Any, Union
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator


class ResourceCategory(str, Enum):
    PERSONNEL = 'personnel'
    RATION = 'ration'
    MEDICAL_EQUIPMENT = 'medical_equipment'
    VEHICLE = 'vehicle'
    SHELTER_OBJECT = 'shelter_object'
    # Extra aliases for compatibility
    SUPPLIES = 'supplies'
    FLEET = 'fleet'


class ResourceStatus(str, Enum):
    AVAILABLE = 'available'
    ASSIGNED = 'assigned'
    IN_TRANSIT = 'in_transit'
    DEPLETED = 'depleted'
    MAINTENANCE = 'maintenance'


class ResourceSource(str, Enum):
    GOVERNMENT = 'government'
    DONATION = 'donation'


class UrgencyLevel(str, Enum):
    CRITICAL = 'critical'
    HIGH = 'high'
    MEDIUM = 'medium'


# 5-Part Fixed Taxonomy
TAXONOMY_MAP: Dict[ResourceCategory, List[str]] = {
    ResourceCategory.PERSONNEL: [
        'Medic', 'Rescue/Boat Operator', 'Volunteer', 'Engineer', 'Comms Operator', 'Security Personnel',
        'Swift-Water Rescue', 'Medical Doctors & Paramedics'
    ],
    ResourceCategory.RATION: [
        'Dry Ration', 'Ready-to-Eat', 'Drinking Water', 'Infant Supplies',
        'Drinking Water (20L Cans)', 'Emergency Food Rations'
    ],
    ResourceCategory.MEDICAL_EQUIPMENT: [
        'First Aid Kit', 'Stretcher', 'Oxygen Cylinder', 'Medication Supply',
        'Trauma First-Aid Kit'
    ],
    ResourceCategory.VEHICLE: [
        'Rescue Boat', 'Ambulance', 'Transport Truck', 'Motorbike',
        'Gemini Inflatable Boats'
    ],
    ResourceCategory.SHELTER_OBJECT: [
        'Bed/Mat', 'Water Container', 'Tent', 'Blanket', 'Sanitation Kit',
        'Community Shelter', 'Disaster Relief Camp', 'Town Hall Camp'
    ],
}


class LocationSchema(BaseModel):
    lat: float = 18.9894
    lng: float = 73.1175
    zone_name: str = "Sector 3 (Panvel)"

    @model_validator(mode='before')
    @classmethod
    def parse_location(cls, v: Any) -> Any:
        if isinstance(v, str):
            return {"lat": 18.9894, "lng": 73.1175, "zone_name": "Sector 3 (Panvel)"}
        if isinstance(v, dict):
            return {
                "lat": float(v.get("lat") or v.get("latitude") or 18.9894),
                "lng": float(v.get("lng") or v.get("longitude") or 73.1175),
                "zone_name": str(v.get("zone_name") or v.get("name") or "Sector 3 (Panvel)"),
            }
        return v


class ResourceCreate(BaseModel):
    category: ResourceCategory
    subtype: str
    name: str
    quantity: int = Field(ge=0)
    location: LocationSchema
    capacity: Optional[int] = Field(None, ge=0)
    occupancy: Optional[int] = Field(None, ge=0)
    source: ResourceSource = ResourceSource.GOVERNMENT


class ResourceUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    status: Optional[ResourceStatus] = None
    assigned_to: Optional[UUID] = None
    occupancy: Optional[int] = Field(None, ge=0)


class ResourceResponse(BaseModel):
    id: Union[UUID, str]
    category: Union[ResourceCategory, str]
    subtype: str
    name: str
    quantity: int
    location: LocationSchema
    capacity: Optional[int] = None
    occupancy: Optional[int] = None
    status: Union[ResourceStatus, str]
    source: Union[ResourceSource, str]
    assigned_to: Optional[Union[UUID, str]] = None
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode='before')
    @classmethod
    def normalize_fields(cls, v: Any) -> Any:
        if isinstance(v, dict):
            # Ensure id exists
            if not v.get('id'):
                v['id'] = str(uuid4())
            # Ensure updated_at exists
            if not v.get('updated_at'):
                v['updated_at'] = v.get('created_at') or datetime.now(timezone.utc)
            if not v.get('created_at'):
                v['created_at'] = datetime.now(timezone.utc)
        return v


class DonationTransferEvent(BaseModel):
    donation_id: UUID
    category: ResourceCategory
    subtype: str
    name: str
    quantity: int = Field(gt=0)
    location: LocationSchema
    target_shelter_id: Optional[UUID] = None


class WorkforceRequestSchema(BaseModel):
    id: UUID
    team_name: str
    team_type: str
    requested_category: ResourceCategory
    requested_subtype: str
    quantity: int
    urgency: UrgencyLevel
    zone: str
    timestamp: datetime


class HandoverRequest(BaseModel):
    workforce_request_id: UUID
    resource_id: UUID
    officer_id: str
    notes: Optional[str] = None


class BroadcastNeedRequest(BaseModel):
    category: ResourceCategory
    subtype: str
    quantity: int
    zone: str
    urgency: UrgencyLevel


class AIInsightResponse(BaseModel):
    id: str
    type: Literal['depletion', 'overcrowding', 'shortage']
    title: str
    message: str
    severity: Literal['red', 'amber', 'blue']
    timestamp: datetime
