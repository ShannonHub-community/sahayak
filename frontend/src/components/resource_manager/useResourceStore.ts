"use client";

import { create } from 'zustand';
import { ResourceItem, WorkforceRequest, AIInsightCard, ResourceCategory, ResourceStatus, ResourceSubtype } from './types';

interface ResourceState {
  resources: ResourceItem[];
  workforceRequests: WorkforceRequest[];
  aiInsights: AIInsightCard[];
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;

  addResource: (item: Omit<ResourceItem, 'id' | 'created_at' | 'updated_at'>) => void;
  updateResourceStatus: (id: string, status: ResourceStatus, assigned_to?: string | null) => void;
  completeHandover: (requestId: string, resourceId: string) => void;
  broadcastNeed: (category: ResourceCategory, subtype: ResourceSubtype, qty: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;
}

const mockResources: ResourceItem[] = [
  { id: 'R-01', category: 'personnel', subtype: 'Rescue/Boat Operator', name: 'NDRF 5th Battalion Water Rescue Squad', quantity: 12, status: 'available', location: { lat: 18.99, lng: 73.11, zoneName: 'Panvel Creek / Uran Naka Base' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-02', category: 'personnel', subtype: 'Medic', name: 'Trauma & Emergency Medical Unit', quantity: 8, status: 'assigned', location: { lat: 18.98, lng: 73.10, zoneName: 'Panvel Sub-District Hospital, Old Panvel' }, assigned_to: 'Med Unit 1', source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-03', category: 'personnel', subtype: 'Volunteer', name: 'Volunteer Manpower Squad', quantity: 35, status: 'available', location: { lat: 18.97, lng: 73.09, zoneName: 'Sector 4' }, source: 'donation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-04', category: 'personnel', subtype: 'Engineer', name: 'PMC Structural & Drainage Team', quantity: 4, status: 'assigned', location: { lat: 18.98, lng: 73.10, zoneName: 'PMC Ward Office No. 4, New Panvel' }, assigned_to: 'Infra Team', source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  { id: 'R-05', category: 'ration', subtype: 'Drinking Water', name: '5,000L Potable Drinking Water', quantity: 500, status: 'available', location: { lat: 18.97, lng: 73.09, zoneName: 'Palaspe Phata Central Supply Warehouse' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-06', category: 'ration', subtype: 'Ready-to-Eat', name: 'High-Calorie Ready-to-Eat Food Packets', quantity: 1400, status: 'available', location: { lat: 18.98, lng: 73.11, zoneName: 'APMC Grain Market Relief Depot, Panvel' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-07', category: 'ration', subtype: 'Infant Supplies', name: 'Sterilized Infant Formula Crates', quantity: 0, status: 'depleted', location: { lat: 18.99, lng: 73.12, zoneName: 'Takka Colony Relief Center' }, source: 'donation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  { id: 'R-08', category: 'medical_equipment', subtype: 'Oxygen Cylinder', name: 'High-Pressure Portable Oxygen Cylinders', quantity: 25, status: 'available', location: { lat: 18.98, lng: 73.10, zoneName: 'Panvel Sub-District Hospital, Old Panvel' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-09', category: 'medical_equipment', subtype: 'Stretcher', name: 'Trauma Stretchers', quantity: 15, status: 'available', location: { lat: 18.98, lng: 73.10, zoneName: 'Civil Hospital' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-10', category: 'medical_equipment', subtype: 'First Aid Kit', name: 'First Aid Kits', quantity: 80, status: 'available', location: { lat: 18.97, lng: 73.09, zoneName: 'Sector 3 Station' }, source: 'donation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  { id: 'R-11', category: 'vehicle', subtype: 'Rescue Boat', name: 'Motorized Inflatable Evacuation Boats', quantity: 6, status: 'assigned', location: { lat: 18.99, lng: 73.12, zoneName: 'Kalundre River Embankment / Takka Colony' }, assigned_to: 'Team Alpha', source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-12', category: 'vehicle', subtype: 'Transport Truck', name: 'Emergency 4x4 Supply Trucks', quantity: 4, status: 'in_transit', location: { lat: 19.00, lng: 73.15, zoneName: 'Zone 2' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-13', category: 'vehicle', subtype: 'Ambulance', name: 'Basic Life Support Ambulances', quantity: 5, status: 'available', location: { lat: 18.98, lng: 73.10, zoneName: 'Panvel Civil' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  { id: 'R-14', category: 'shelter_object', subtype: 'Tent', name: 'Panvel Town Hall Emergency Relief Shelter', quantity: 1, status: 'available', location: { lat: 18.98, lng: 73.12, zoneName: 'Bunder Road, Old Panvel' }, capacity: 350, occupancy: 342, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-15', category: 'shelter_object', subtype: 'Tent', name: 'Khandeshwar Sector 9 Municipal School Shelter', quantity: 1, status: 'available', location: { lat: 18.97, lng: 73.10, zoneName: 'New Panvel' }, capacity: 500, occupancy: 210, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-16', category: 'shelter_object', subtype: 'Tent', name: 'Karnala Sports Complex Transit Shelter', quantity: 1, status: 'available', location: { lat: 19.02, lng: 73.06, zoneName: 'Panvel' }, capacity: 400, occupancy: 320, source: 'donation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const mockRequests: WorkforceRequest[] = [
  { id: 'REQ-1', team_name: 'NDRF Unit Alpha', team_type: 'NDRF', requested_category: 'vehicle', requested_subtype: 'Rescue Boat', quantity: 2, urgency: 'critical', zone: 'Zone 2', timestamp: new Date().toISOString() },
  { id: 'REQ-2', team_name: 'Panvel Trauma Squad', team_type: 'Medical', requested_category: 'medical_equipment', requested_subtype: 'Oxygen Cylinder', quantity: 10, urgency: 'high', zone: 'Sector 1', timestamp: new Date().toISOString() },
  { id: 'REQ-3', team_name: 'Volunteer Squad B', team_type: 'Volunteer', requested_category: 'ration', requested_subtype: 'Drinking Water', quantity: 300, urgency: 'medium', zone: 'Sector 4', timestamp: new Date().toISOString() }
];

const mockAIInsights: AIInsightCard[] = [
  { id: 'AI-1', type: 'depletion', title: 'Infant Formula Depleted', message: 'Infant Formula Crates depleted in Takka Colony. Immediate restocking required.', severity: 'amber', timestamp: new Date().toISOString() },
  { id: 'AI-2', type: 'overcrowding', title: 'Shelter Overcrowding', message: 'Panvel Town Hall at 97.7% capacity. Divert intake to Khandeshwar Sector 9.', severity: 'red', timestamp: new Date().toISOString() }
];

export const useResourceStore = create<ResourceState>((set) => ({
  resources: mockResources,
  workforceRequests: mockRequests,
  aiInsights: mockAIInsights,
  searchQuery: '',
  categoryFilter: 'All',
  statusFilter: 'All Statuses',

  addResource: (item) => set((state) => {
    const newId = `R-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();
    return {
      resources: [...state.resources, { ...item, id: newId, created_at: now, updated_at: now }]
    };
  }),

  updateResourceStatus: (id, status, assigned_to = null) => set((state) => ({
    resources: state.resources.map(r => r.id === id ? { ...r, status, assigned_to, updated_at: new Date().toISOString() } : r)
  })),

  completeHandover: (requestId, resourceId) => set((state) => {
    const req = state.workforceRequests.find(r => r.id === requestId);
    if (!req) return state;

    return {
      workforceRequests: state.workforceRequests.filter(r => r.id !== requestId),
      resources: state.resources.map(r => r.id === resourceId ? { ...r, status: 'assigned', assigned_to: req.team_name, updated_at: new Date().toISOString() } : r)
    };
  }),

  broadcastNeed: (category, subtype, qty) => set((state) => {
    console.log(`Broadcasting need to Citizen Portal: ${qty}x ${subtype} (${category})`);
    return state;
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ categoryFilter: category }),
  setSelectedStatus: (status) => set({ statusFilter: status })
}));
