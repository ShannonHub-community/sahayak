from enum import Enum
from typing import Optional, Literal, Dict, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class ResourceCategory(str, Enum):
    PERSONNEL = 'personnel'
    RATION = 'ration'
    MEDICAL_EQUIPMENT = 'medical_equipment'
    VEHICLE = 'vehicle'
    SHELTER_OBJECT = 'shelter_object'


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
        'Medic', 'Rescue/Boat Operator', 'Volunteer', 'Engineer', 'Comms Operator', 'Security Personnel'
    ],
    ResourceCategory.RATION: [
        'Dry Ration', 'Ready-to-Eat', 'Drinking Water', 'Infant Supplies'
    ],
    ResourceCategory.MEDICAL_EQUIPMENT: [
        'First Aid Kit', 'Stretcher', 'Oxygen Cylinder', 'Medication Supply'
    ],
    ResourceCategory.VEHICLE: [
        'Rescue Boat', 'Ambulance', 'Transport Truck', 'Motorbike'
    ],
    ResourceCategory.SHELTER_OBJECT: [
        'Bed/Mat', 'Water Container', 'Tent', 'Blanket', 'Sanitation Kit'
    ],
}


class LocationSchema(BaseModel):
    lat: float
    lng: float
    zone_name: str


class ResourceCreate(BaseModel):
    category: ResourceCategory
    subtype: str
    name: str
    quantity: int = Field(ge=0)
    location: LocationSchema
    capacity: Optional[int] = Field(None, ge=0)
    occupancy: Optional[int] = Field(None, ge=0)
    source: ResourceSource = ResourceSource.GOVERNMENT

    @model_validator(mode='after')
    def validate_taxonomy_and_shelter(self):
        # Validate subtype
        valid_subtypes = TAXONOMY_MAP.get(self.category, [])
        if self.subtype not in valid_subtypes:
            raise ValueError(f"Invalid subtype '{self.subtype}' for category '{self.category.value}'. Valid subtypes: {valid_subtypes}")
        
        # Enforce capacity & occupancy for shelter objects
        if self.category == ResourceCategory.SHELTER_OBJECT:
            if self.capacity is None or self.occupancy is None:
                raise ValueError("capacity and occupancy are required when category is 'shelter_object'")
        
        return self


class ResourceUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    status: Optional[ResourceStatus] = None
    assigned_to: Optional[UUID] = None
    occupancy: Optional[int] = Field(None, ge=0)


class ResourceResponse(BaseModel):
    id: UUID
    category: ResourceCategory
    subtype: str
    name: str
    quantity: int
    location: LocationSchema
    capacity: Optional[int] = None
    occupancy: Optional[int] = None
    status: ResourceStatus
    source: ResourceSource
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


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
