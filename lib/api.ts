import {
  mockOfficers,
  mockSOSRequests,
  mockCamps,
  mockIncidents,
  mockResources,
  mockAuditLogs,
  Officer,
  SOSRequest,
  ReliefCamp,
  Incident,
  Resource,
  AuditLog,
  ReassignOfficerRequest,
  MarkOfflineRequest,
  IntakeResourceRequest,
  DispatchRequest,
} from "./mockData";

export const USE_MOCK = true; // Set to true by default so dev server loads cleanly. Set to false when FastAPI backend is running!
export const BASE_URL = "http://127.0.0.1:8000";

/**
 * Fetch list of field officers
 * Endpoint: GET /api/v1/officers
 */
export async function fetchOfficers(): Promise<Officer[]> {
  if (USE_MOCK) return mockOfficers;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/officers`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch officers from backend, falling back to mock data:", err);
    return mockOfficers;
  }
}

/**
 * Fetch specific officer details by ID
 * Endpoint: GET /api/v1/officers/{officer_id}
 */
export async function fetchOfficerById(officerId: string): Promise<Officer | null> {
  if (USE_MOCK) {
    return mockOfficers.find((o) => o.id === officerId) || null;
  }
  try {
    const res = await fetch(`${BASE_URL}/api/v1/officers/${officerId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch officer ${officerId} from backend, falling back to mock data:`, err);
    return mockOfficers.find((o) => o.id === officerId) || null;
  }
}

/**
 * Reassign an officer sector/status
 * Endpoint: PUT /api/v1/officers/{officer_id}/status
 */
export async function reassignOfficer(
  officerId: string,
  payload: ReassignOfficerRequest
): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/officers/${officerId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to reassign officer ${officerId}:`, err);
    return false;
  }
}

/**
 * Mark officer offline / end shift
 * Endpoint: PUT /api/v1/officers/{officer_id}/offline
 */
export async function markOfficerOffline(
  officerId: string,
  reason: string = "Shift Ended"
): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/officers/${officerId}/offline`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to mark officer ${officerId} offline:`, err);
    return false;
  }
}

/**
 * Fetch SOS requests queue
 * Endpoint: GET /api/v1/sos-requests
 */
export async function fetchSOSRequests(): Promise<SOSRequest[]> {
  if (USE_MOCK) return mockSOSRequests;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sos-requests`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch SOS requests from backend, falling back to mock data:", err);
    return mockSOSRequests;
  }
}

/**
 * Fetch relief camps
 * Endpoint: GET /api/v1/camps
 */
export async function fetchCamps(): Promise<ReliefCamp[]> {
  if (USE_MOCK) return mockCamps;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/camps`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch relief camps from backend, falling back to mock data:", err);
    return mockCamps;
  }
}

/**
 * Fetch active incidents
 * Endpoint: GET /api/v1/incidents
 */
export async function fetchIncidents(): Promise<Incident[]> {
  if (USE_MOCK) return mockIncidents;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch incidents from backend, falling back to mock data:", err);
    return mockIncidents;
  }
}

/**
 * Fetch resource inventory
 * Endpoint: GET /api/v1/resources
 */
export async function fetchResources(): Promise<Resource[]> {
  if (USE_MOCK) return mockResources;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/resources`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch resources from backend, falling back to mock data:", err);
    return mockResources;
  }
}

/**
 * Intake new resource into inventory
 * Endpoint: POST /api/v1/resources
 */
export async function intakeResource(payload: IntakeResourceRequest): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error("Failed to intake resource:", err);
    return false;
  }
}

/**
 * Fetch audit logs
 * Endpoint: GET /api/v1/audit-logs
 */
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (USE_MOCK) return mockAuditLogs;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/audit-logs`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch audit logs from backend, falling back to mock data:", err);
    return mockAuditLogs;
  }
}

/**
 * Dispatch unit to an incident
 * Endpoint: POST /api/v1/dispatch
 */
export async function dispatchUnit(payload: DispatchRequest): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error("Failed to dispatch unit:", err);
    return false;
  }
}
