export interface Incident {
  id: string;
  category: string;
  ward: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  lat: number;
  lng: number;
  assignedTeam?: string;
  status: "Pending" | "Dispatched" | "Resolved";
  timestamp: string;
}

export interface Resource {
  id: string;
  name: string;
  category: "Rescue Boats" | "Dewatering Pumps" | "Ambulances" | "Generators" | "Relief Supplies";
  allocatedWard: string;
  quantity: number;
  available: number;
  unit: string;
  status: "Operational" | "In Use" | "Maintenance" | "Out of Stock";
  lastInspected: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-101",
    category: "Waterlogging",
    ward: "Ward 3 (Station Road)",
    severity: "High",
    description: "3ft water accumulation blocking Station Road intersection",
    lat: 18.9894,
    lng: 73.1175,
    assignedTeam: "Municipal Crew",
    status: "Pending",
    timestamp: "18:35 IST"
  },
  {
    id: "INC-102",
    category: "Evacuation",
    ward: "Ward 1 (Old Panvel)",
    severity: "Critical",
    description: "15 families stranded near riverbank in low-lying residential cluster",
    lat: 18.9950,
    lng: 73.1120,
    assignedTeam: "NDRF Unit 1",
    status: "Dispatched",
    timestamp: "18:42 IST"
  },
  {
    id: "INC-103",
    category: "Road Blocked",
    ward: "Ward 5 (Khandeshwar)",
    severity: "Medium",
    description: "Submerged underpass under Khandeshwar flyover",
    lat: 18.9820,
    lng: 73.1250,
    assignedTeam: "Public Works Dept",
    status: "Pending",
    timestamp: "18:15 IST"
  },
];

const MOCK_RESOURCES: Resource[] = [
  { id: "RES-001", name: "Inflatable Rescue Boat (IRB-250)", category: "Rescue Boats", allocatedWard: "Ward 1 (Old Panvel)", quantity: 8, available: 6, unit: "Boats", status: "Operational", lastInspected: "Today, 08:00" },
  { id: "RES-002", name: "High-Capacity Dewatering Pump (100 HP)", category: "Dewatering Pumps", allocatedWard: "Ward 3 (Station Rd)", quantity: 12, available: 4, unit: "Pumps", status: "In Use", lastInspected: "Today, 10:30" },
];

export async function fetchIncidents(): Promise<{ data: Incident[]; isFallback: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${BASE_URL}/incidents`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("API Offline");
    const data = await response.json();
    return { data, isFallback: false };
  } catch (err) {
    return { data: MOCK_INCIDENTS, isFallback: true };
  }
}

export async function fetchResources(): Promise<{ data: Resource[]; isFallback: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/resources`);
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    return { data, isFallback: false };
  } catch (err) {
    return { data: MOCK_RESOURCES, isFallback: true };
  }
}