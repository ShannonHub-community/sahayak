const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

const RESOURCES_API = `${API_BASE}/api/v1/resources`;
const RESOURCES_WS = `${WS_BASE}/api/v1/resources/ws/resources`;

import { ResourceItem, AIInsightCard, WorkforceRequest, ResourceCategory, ResourceStatus, ResourceSubtype } from './types';

/* ── REST helpers ─────────────────────────────────────── */

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

/** GET /api/v1/resources — list with optional query filters */
export async function fetchResources(filters?: {
  category?: string;
  status?: string;
  zone?: string;
  search?: string;
}): Promise<ResourceItem[]> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category.toLowerCase());
  if (filters?.status && filters.status !== 'All Statuses') params.set('status', filters.status.toLowerCase());
  if (filters?.zone) params.set('zone', filters.zone);
  if (filters?.search) params.set('search', filters.search);

  const qs = params.toString();
  const url = qs ? `${RESOURCES_API}?${qs}` : RESOURCES_API;
  return handleResponse<ResourceItem[]>(await fetch(url));
}

/** POST /api/v1/resources — create government stock */
export async function createResourceApi(data: Omit<ResourceItem, 'id' | 'created_at' | 'updated_at'>): Promise<ResourceItem> {
  return handleResponse<ResourceItem>(
    await fetch(RESOURCES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
}

/** GET /api/v1/resources/insights — get active insights */
export async function fetchInsightsApi(): Promise<AIInsightCard[]> {
  return handleResponse<AIInsightCard[]>(await fetch(`${RESOURCES_API}/insights`));
}

/** GET /api/v1/resources/workforce/queue — get workforce requests */
export async function fetchWorkforceQueueApi(): Promise<WorkforceRequest[]> {
  return handleResponse<WorkforceRequest[]>(await fetch(`${RESOURCES_API}/workforce/queue`));
}

/** GET /api/v1/resources/:id */
export async function fetchResourceByIdApi(id: string): Promise<ResourceItem> {
  return handleResponse<ResourceItem>(await fetch(`${RESOURCES_API}/${id}`));
}

/** PATCH /api/v1/resources/:id */
export async function updateResourceApi(
  id: string,
  data: { status?: ResourceStatus; quantity?: number; occupancy?: number; assigned_to?: string | null }
): Promise<ResourceItem> {
  return handleResponse<ResourceItem>(
    await fetch(`${RESOURCES_API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
}

/** POST /api/v1/resources/dispatch/handover */
export async function executeHandoverApi(workforce_request_id: string, resource_id: string, officer_id: string, notes?: string): Promise<ResourceItem> {
  return handleResponse<ResourceItem>(
    await fetch(`${RESOURCES_API}/dispatch/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workforce_request_id, resource_id, officer_id, notes }),
    })
  );
}

/** POST /api/v1/resources/broadcast-need */
export async function broadcastNeedApi(category: ResourceCategory, subtype: ResourceSubtype, quantity: number, zone: string, urgency: string): Promise<any> {
  return handleResponse<any>(
    await fetch(`${RESOURCES_API}/broadcast-need`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, subtype, quantity, zone, urgency }),
    })
  );
}

/* ── WebSocket ────────────────────────────────────────── */

export interface ResourceWebSocketEvent {
  event: string;
  payload: Record<string, any>;
}

export type ResourceWsEventHandler = (event: ResourceWebSocketEvent) => void;

/**
 * Opens a persistent WebSocket connection for real-time resource events.
 * Returns a cleanup function to close the socket.
 */
export function connectResourceWebSocket(
  onEvent: ResourceWsEventHandler,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let intentionallyClosed = false;

  function connect() {
    if (intentionallyClosed) return;

    ws = new WebSocket(RESOURCES_WS);

    ws.onopen = () => {
      onStatusChange?.(true);
    };

    ws.onmessage = (msg) => {
      try {
        const parsed: ResourceWebSocketEvent = JSON.parse(msg.data);
        onEvent(parsed);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      onStatusChange?.(false);
      if (!intentionallyClosed) {
        // Auto-reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  // Cleanup function
  return () => {
    intentionallyClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
