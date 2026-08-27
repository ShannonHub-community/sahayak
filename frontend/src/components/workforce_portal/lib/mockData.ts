export interface AssignmentHistoryItem {
  id: string;
  taskName: string;
  sector: string;
  status: "Completed" | "In Progress" | "Transferred" | string;
  timestamp: string;
}

export interface Officer {
  id: string;
  name: string;
  role: string;
  sector: string;
  status: "On Field" | "Dispatched" | "Standby" | "Critical" | string;
  phone: string;
  assignmentHistory: AssignmentHistoryItem[];
}

export interface SOSRequest {
  id: string;
  category: string;
  ward: string;
  severity: "Critical" | "High" | "Medium" | "Low" | string;
  description: string;
  status: "Pending Approval" | "Dispatched" | "Locked" | string;
  assignedTeam?: string | null;
  timestamp: string;
}

export interface ReliefCamp {
  id: string;
  name: string;
  location: string;
  capacity: number;
  occupancy: number;
  status: "Open" | "Full" | "Standby" | string;
}

export interface Incident {
  id: string;
  category: string;
  ward: string;
  severity: "Critical" | "High" | "Medium" | "Low" | string;
  description: string;
  lat: number;
  lng: number;
  assignedTeam?: string | null;
  status: "Pending" | "Dispatched" | "Resolved" | string;
  timestamp: string;
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  allocatedWard: string;
  total: number;
  available: number;
  unit: string;
  status: string;
  lastInspected: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  ip: string;
}

export interface ReassignOfficerRequest {
  sector?: string | null;
  status?: string | null;
}

export interface MarkOfflineRequest {
  reason?: string;
}

export interface IntakeResourceRequest {
  name: string;
  category: string;
  allocatedWard: string;
  total: number;
  available: number;
  unit: string;
  status: string;
}

export interface DispatchRequest {
  incidentId: string;
  assignedTeam: string;
}

export const mockOfficers: Officer[] = [
  {
    id: "OFF-101",
    name: "Insp. R. Sharma",
    role: "NDRF Unit 1 (Rescue Lead)",
    sector: "Ward 1 (Old Panvel)",
    status: "On Field",
    phone: "+91 98201 44321",
    assignmentHistory: [
      { id: "HIS-301", taskName: "Riverbank Evacuation Ops", sector: "Ward 1 (Old Panvel)", status: "In Progress", timestamp: "Today, 18:42 IST" },
      { id: "HIS-289", taskName: "Sludge Pump Deployment", sector: "Ward 3 (Station Road)", status: "Completed", timestamp: "Today, 14:15 IST" },
      { id: "HIS-254", taskName: "Flood Risk Assessment Patrol", sector: "Ward 2 (New Panvel)", status: "Completed", timestamp: "Yesterday, 09:30 IST" },
    ],
  },
  {
    id: "OFF-102",
    name: "Dr. A. Verma",
    role: "EMS Ambulance 3 (Medical Lead)",
    sector: "Ward 4 (Kalamboli)",
    status: "Dispatched",
    phone: "+91 97110 88234",
    assignmentHistory: [
      { id: "HIS-304", taskName: "Oxygen Cylinder Transport", sector: "Ward 4 (Kalamboli)", status: "In Progress", timestamp: "Today, 18:28 IST" },
      { id: "HIS-277", taskName: "Triage Setup at Shelter 2", sector: "Ward 4 (Kalamboli)", status: "Completed", timestamp: "Today, 11:00 IST" },
      { id: "HIS-240", taskName: "Medical Inventory Audit", sector: "Central Warehouse", status: "Completed", timestamp: "Yesterday, 16:45 IST" },
    ],
  },
  {
    id: "OFF-103",
    name: "Capt. S. Kadam",
    role: "Civil Defense (Relief Overseer)",
    sector: "Ward 5 (Khandeshwar)",
    status: "Standby",
    phone: "+91 94223 11902",
    assignmentHistory: [
      { id: "HIS-295", taskName: "Ration Pack Distribution", sector: "Ward 5 (Khandeshwar)", status: "Completed", timestamp: "Today, 15:30 IST" },
      { id: "HIS-261", taskName: "Flyover Underpass Inspection", sector: "Ward 5 (Khandeshwar)", status: "Completed", timestamp: "Today, 08:20 IST" },
      { id: "HIS-218", taskName: "Shelter Capacity Audit", sector: "Ward 2 (New Panvel)", status: "Completed", timestamp: "Yesterday, 19:10 IST" },
    ],
  },
  {
    id: "OFF-104",
    name: "Station Officer V. Patil",
    role: "Municipal Fire Squad 2",
    sector: "Ward 3 (Station Road)",
    status: "Standby",
    phone: "+91 98692 55431",
    assignmentHistory: [
      { id: "HIS-282", taskName: "100 HP Sludge Dewatering", sector: "Ward 3 (Station Road)", status: "Completed", timestamp: "Today, 13:00 IST" },
      { id: "HIS-233", taskName: "Fallen Tree Obstruction Removal", sector: "Ward 1 (Old Panvel)", status: "Completed", timestamp: "Yesterday, 14:00 IST" },
      { id: "HIS-190", taskName: "Vehicle Extraction Ops", sector: "Ward 3 (Station Road)", status: "Completed", timestamp: "2 days ago" },
    ],
  },
  {
    id: "OFF-105",
    name: "Sub-Insp. M. Kadam",
    role: "SDRF Water Rescue Unit",
    sector: "Ward 2 (New Panvel)",
    status: "Critical",
    phone: "+91 99304 77123",
    assignmentHistory: [
      { id: "HIS-308", taskName: "Rescue Boat Deep Water Patrol", sector: "Ward 2 (New Panvel)", status: "In Progress", timestamp: "Today, 19:05 IST" },
      { id: "HIS-271", taskName: "Siren Warning Dispatch", sector: "Ward 1 (Old Panvel)", status: "Completed", timestamp: "Today, 10:45 IST" },
      { id: "HIS-205", taskName: "Equipment Transfer to Base", sector: "Central Warehouse", status: "Completed", timestamp: "Yesterday, 12:15 IST" },
    ],
  },
];

export const mockSOSRequests: SOSRequest[] = [
  { id: "SOS-102", category: "Evacuation", ward: "Ward 1 (Old Panvel)", severity: "Critical", description: "15 families stranded near riverbank in low-lying residential cluster", status: "Pending Approval", timestamp: "18:42 IST" },
  { id: "SOS-101", category: "Waterlogging", ward: "Ward 3 (Station Road)", severity: "High", description: "3ft water accumulation blocking main intersection", status: "Pending Approval", timestamp: "18:35 IST" },
  { id: "SOS-104", category: "Medical Emergency", ward: "Ward 4 (Kalamboli)", severity: "High", description: "Elderly resident requires urgent oxygen transport", status: "Dispatched", assignedTeam: "EMS Ambulance 3", timestamp: "18:28 IST" },
];

export const mockCamps: ReliefCamp[] = [
  { id: "CMP-001", name: "Panvel Municipal High School", location: "Ward 1 (Old Panvel)", capacity: 500, occupancy: 340, status: "Open" },
  { id: "CMP-002", name: "Kalamboli Community Center", location: "Ward 4 (Kalamboli)", capacity: 400, occupancy: 290, status: "Open" },
  { id: "CMP-003", name: "Khandeshwar Sports Complex", location: "Ward 5 (Khandeshwar)", capacity: 600, occupancy: 570, status: "Full" },
];

export const mockIncidents: Incident[] = [
  { id: "INC-101", category: "Waterlogging", ward: "Ward 3 (Station Road)", severity: "High", description: "3ft water accumulation blocking intersection", lat: 18.9894, lng: 73.1175, assignedTeam: "Municipal Crew", status: "Pending", timestamp: "18:35 IST" },
  { id: "INC-102", category: "Evacuation", ward: "Ward 1 (Old Panvel)", severity: "Critical", description: "15 families stranded near riverbank", lat: 18.9950, lng: 73.1120, assignedTeam: "NDRF Unit 1", status: "Dispatched", timestamp: "18:42 IST" },
  { id: "INC-103", category: "Road Blocked", ward: "Ward 5 (Khandeshwar)", severity: "Medium", description: "Submerged flyover underpass", lat: 18.9820, lng: 73.1250, assignedTeam: "Public Works Dept", status: "Pending", timestamp: "18:15 IST" },
];

export const mockResources: Resource[] = [
  { id: "RES-001", name: "Inflatable Rescue Boat (IRB-250)", category: "Boats", allocatedWard: "Ward 1 (Old Panvel)", total: 8, available: 6, unit: "Boats", status: "Operational", lastInspected: "Today, 08:00 IST" },
  { id: "RES-002", name: "100 HP Sludge Dewatering Pump", category: "Pumps", allocatedWard: "Ward 3 (Station Road)", total: 12, available: 4, unit: "Pumps", status: "In Use", lastInspected: "Today, 10:30 IST" },
];

export const mockAuditLogs: AuditLog[] = [
  { id: "LOG-901", action: "Resource Lock Approved", user: "Officer R. Sharma", target: "NDRF Unit 1 -> SOS-102", timestamp: "18:42:10 IST", ip: "192.168.1.15" },
  { id: "LOG-902", action: "Emergency Level Raised", user: "Duty Officer (RDC)", target: "Panvel Sector 4", timestamp: "18:30:04 IST", ip: "192.168.1.10" },
];
