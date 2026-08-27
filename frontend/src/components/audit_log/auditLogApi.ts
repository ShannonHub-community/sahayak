const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL_AUDIT || 'ws://localhost:8000';

const TICKETS_API = `${API_BASE}/api/tickets`;
const TICKETS_WS = `${WS_BASE}/api/tickets/ws`;

import { Ticket, TicketInquiry } from './types';

/* ── REST helpers ─────────────────────────────────────── */

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

/** GET /api/tickets — list with optional query filters */
export async function fetchTickets(filters?: {
  department?: string;
  type?: string;
  status?: string;
}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.department && filters.department !== 'all') params.set('department', filters.department);
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);

  const qs = params.toString();
  const url = qs ? `${TICKETS_API}?${qs}` : TICKETS_API;
  return handleResponse<Ticket[]>(await fetch(url));
}

/** GET /api/tickets/:id — single ticket with nested inquiries */
export async function fetchTicketById(ticketId: string): Promise<Ticket> {
  return handleResponse<Ticket>(await fetch(`${TICKETS_API}/${ticketId}`));
}

/** POST /api/tickets/:id/revert — revert an order */
export async function revertTicketApi(
  ticketId: string,
  revertReason: string
): Promise<Ticket> {
  return handleResponse<Ticket>(
    await fetch(`${TICKETS_API}/${ticketId}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revert_reason: revertReason }),
    })
  );
}

/** POST /api/tickets/:id/inquiries — submit an admin inquiry */
export async function submitInquiryApi(
  ticketId: string,
  question: string,
  askedBy: string = 'Admin Command'
): Promise<Ticket> {
  return handleResponse<Ticket>(
    await fetch(`${TICKETS_API}/${ticketId}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, asked_by: askedBy }),
    })
  );
}

/** PATCH /api/tickets/:id/inquiries/:inqId/answer — department answers */
export async function answerInquiryApi(
  ticketId: string,
  inquiryId: string,
  response: string
): Promise<Ticket> {
  return handleResponse<Ticket>(
    await fetch(`${TICKETS_API}/${ticketId}/inquiries/${inquiryId}/answer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    })
  );
}

/** GET /api/tickets/badge-count */
export async function fetchBadgeCount(): Promise<number> {
  const data = await handleResponse<{ pending_inquiries_count: number }>(
    await fetch(`${TICKETS_API}/badge-count`)
  );
  return data.pending_inquiries_count;
}

/* ── WebSocket ────────────────────────────────────────── */

export interface WebSocketEvent {
  event: string;
  payload: Record<string, unknown>;
}

export type WsEventHandler = (event: WebSocketEvent) => void;

/**
 * Opens a persistent WebSocket connection for real-time audit log events.
 * Returns a cleanup function to close the socket.
 */
export function connectAuditLogWebSocket(
  onEvent: WsEventHandler,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let intentionallyClosed = false;

  function connect() {
    if (intentionallyClosed) return;

    ws = new WebSocket(TICKETS_WS);

    ws.onopen = () => {
      onStatusChange?.(true);
    };

    ws.onmessage = (msg) => {
      try {
        const parsed: WebSocketEvent = JSON.parse(msg.data);
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
