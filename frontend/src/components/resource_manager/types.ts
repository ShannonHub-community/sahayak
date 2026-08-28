export type ResourceCategory =
  | 'personnel'
  | 'ration'
  | 'medical_equipment'
  | 'vehicle'
  | 'shelter_object';

export type ResourceStatus =
  | 'available'
  | 'assigned'
  | 'in_transit'
  | 'depleted'
  | 'maintenance';

export type ResourceSource = 'government' | 'donation';

export type PersonnelSubtype =
  | 'Medic'
  | 'Rescue/Boat Operator'
  | 'Volunteer'
  | 'Engineer'
  | 'Comms Operator'
  | 'Security Personnel';

export type RationSubtype =
  | 'Dry Ration'
  | 'Ready-to-Eat'
  | 'Drinking Water'
  | 'Infant Supplies';

export type MedicalSubtype =
  | 'First Aid Kit'
  | 'Stretcher'
  | 'Oxygen Cylinder'
  | 'Medication Supply';

export type VehicleSubtype =
  | 'Rescue Boat'
  | 'Ambulance'
  | 'Transport Truck'
  | 'Motorbike';

export type ShelterSubtype =
  | 'Bed/Mat'
  | 'Water Container'
  | 'Tent'
  | 'Blanket'
  | 'Sanitation Kit';

export type ResourceSubtype =
  | PersonnelSubtype
  | RationSubtype
  | MedicalSubtype
  | VehicleSubtype
  | ShelterSubtype;

export interface ResourceItem {
  id: string;
  category: ResourceCategory;
  subtype: ResourceSubtype;
  name: string;
  quantity: number;
  status: ResourceStatus;
  location: { lat: number; lng: number; zoneName: string };
  assigned_to?: string | null;
  source: ResourceSource;
  capacity?: number | null;
  occupancy?: number | null;
  challan_number?: string | null;
  issuing_depot?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkforceRequest {
  id: string;
  team_name: string;
  team_type: string;
  requested_category: ResourceCategory;
  requested_subtype: ResourceSubtype;
  quantity: number;
  urgency: 'critical' | 'high' | 'medium';
  zone: string;
  timestamp: string;
}

export interface AIInsightCard {
  id: string;
  type: 'depletion' | 'overcrowding' | 'shortage';
  title: string;
  message: string;
  severity: 'red' | 'amber' | 'blue';
  timestamp: string;
}
