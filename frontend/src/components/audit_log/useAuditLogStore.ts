import { create } from 'zustand';
import { Ticket, AuditLogFilters, TicketInquiry } from './types';
import { INITIAL_MOCK_TICKETS } from './mockData';
import {
  fetchTickets,
  revertTicketApi,
  submitInquiryApi,
  connectAuditLogWebSocket,
  WebSocketEvent,
} from './auditLogApi';

interface AuditLogStore {
  /* ── State ───────────────────────────────────────── */
  tickets: Ticket[];
  filters: AuditLogFilters;
  selectedTicketId: string | null;
  revertModalTicket: Ticket | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  pendingBadgeCount: number;

  /* ── Actions ─────────────────────────────────────── */
  setFilters: (filters: Partial<AuditLogFilters>) => void;
  revertTicket: (ticketId: string, reason: string) => Promise<void>;
  addInquiry: (ticketId: string, question: string) => Promise<void>;
  openRevertModal: (ticket: Ticket) => void;
  closeRevertModal: () => void;
  setSelectedTicket: (ticketId: string | null) => void;

  /** Fetch tickets from backend; falls back to mock data on failure */
  loadTickets: () => Promise<void>;

  /** Start the WebSocket connection for real-time updates */
  initWebSocket: () => () => void;
}

export const useAuditLogStore = create<AuditLogStore>((set, get) => ({
  tickets: [],
  filters: {
    search: '',
    department: 'all',
    type: 'all',
    status: 'all',
  },
  selectedTicketId: null,
  revertModalTicket: null,
  isLoading: true,
  isConnected: false,
  error: null,
  pendingBadgeCount: 0,

  /* ── Filter setter (purely local, instant) ──────── */
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  /* ── Load tickets from backend ──────────────────── */
  loadTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchTickets();
      set({ tickets: data, isLoading: false });
    } catch (err) {
      console.warn('[AuditLog] Backend unavailable, falling back to mock data:', err);
      set({
        tickets: INITIAL_MOCK_TICKETS,
        isLoading: false,
        error: 'Using offline mock data — backend unreachable.',
      });
    }
  },

  /* ── Revert via API ─────────────────────────────── */
  revertTicket: async (ticketId, reason) => {
    try {
      const updatedTicket = await revertTicketApi(ticketId, reason);
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === ticketId ? updatedTicket : t
        ),
      }));
    } catch (err) {
      console.warn('[AuditLog] Revert API failed, applying locally:', err);
      // Graceful local fallback
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: 'reverted' as const,
                revert_reason: reason,
                updated_at: new Date().toISOString(),
              }
            : ticket
        ),
      }));
    }
  },

  /* ── Submit inquiry via API ─────────────────────── */
  addInquiry: async (ticketId, question) => {
    try {
      const updatedTicket = await submitInquiryApi(ticketId, question);
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === ticketId ? updatedTicket : t
        ),
      }));
    } catch (err) {
      console.warn('[AuditLog] Inquiry API failed, applying locally:', err);
      // Graceful local fallback
      const newInquiry: TicketInquiry = {
        id: `inq-${Math.random().toString(36).substr(2, 9)}`,
        ticket_id: ticketId,
        question,
        response: null,
        asked_by: 'Admin Command',
        status: 'awaiting_response',
        created_at: new Date().toISOString(),
        answered_at: null,
      };
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                inquiries: [...(ticket.inquiries || []), newInquiry],
                updated_at: new Date().toISOString(),
              }
            : ticket
        ),
      }));
    }
  },

  /* ── Modal controls ─────────────────────────────── */
  openRevertModal: (ticket) => set({ revertModalTicket: ticket }),
  closeRevertModal: () => set({ revertModalTicket: null }),
  setSelectedTicket: (ticketId) => set({ selectedTicketId: ticketId }),

  /* ── WebSocket for real-time updates ────────────── */
  initWebSocket: () => {
    const handleEvent = (event: WebSocketEvent) => {
      const { event: eventType, payload } = event;

      switch (eventType) {
        case 'TICKET_CREATED': {
          const newTicket = payload as unknown as Ticket;
          set((state) => ({
            tickets: [newTicket, ...state.tickets],
          }));
          break;
        }

        case 'TICKET_UPDATED':
        case 'ORDER_REVERTED_STOP': {
          const updated = payload as unknown as Ticket;
          const ticketId = (payload.ticket_id as string) || (payload.id as string);
          if (ticketId) {
            set((state) => ({
              tickets: state.tickets.map((t) =>
                t.id === ticketId
                  ? eventType === 'TICKET_UPDATED'
                    ? (updated as Ticket)
                    : { ...t, status: 'reverted' as const, revert_reason: payload.reason as string }
                  : t
              ),
            }));
          }
          break;
        }

        case 'INQUIRY_UPDATED': {
          const inq = payload as unknown as TicketInquiry;
          set((state) => ({
            tickets: state.tickets.map((t) =>
              t.id === inq.ticket_id
                ? {
                    ...t,
                    inquiries: (t.inquiries || []).some((i) => i.id === inq.id)
                      ? (t.inquiries || []).map((i) => (i.id === inq.id ? inq : i))
                      : [...(t.inquiries || []), inq],
                  }
                : t
            ),
          }));
          break;
        }

        case 'BADGE_COUNT_UPDATED': {
          set({ pendingBadgeCount: payload.pending_inquiries_count as number });
          break;
        }
      }
    };

    const handleStatus = (connected: boolean) => {
      set({ isConnected: connected });
    };

    return connectAuditLogWebSocket(handleEvent, handleStatus);
  },
}));
