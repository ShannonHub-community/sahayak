import { create } from 'zustand';
import { Ticket, AuditLogFilters, TicketInquiry } from './types';
import { INITIAL_MOCK_TICKETS } from './mockData';

interface AuditLogStore {
  tickets: Ticket[];
  filters: AuditLogFilters;
  selectedTicketId: string | null;
  revertModalTicket: Ticket | null;
  
  setFilters: (filters: Partial<AuditLogFilters>) => void;
  revertTicket: (ticketId: string, reason: string) => void;
  addInquiry: (ticketId: string, question: string) => void;
  openRevertModal: (ticket: Ticket) => void;
  closeRevertModal: () => void;
  setSelectedTicket: (ticketId: string | null) => void;
}

export const useAuditLogStore = create<AuditLogStore>((set) => ({
  tickets: INITIAL_MOCK_TICKETS,
  filters: {
    search: '',
    department: 'all',
    type: 'all',
    status: 'all',
  },
  selectedTicketId: null,
  revertModalTicket: null,

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  revertTicket: (ticketId, reason) => set((state) => ({
    tickets: state.tickets.map((ticket) => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status: 'reverted', 
            revert_reason: reason, 
            updated_at: new Date().toISOString() 
          }
        : ticket
    )
  })),

  addInquiry: (ticketId, question) => set((state) => {
    const newInquiry: TicketInquiry = {
      id: `inq-${Math.random().toString(36).substr(2, 9)}`,
      ticket_id: ticketId,
      question,
      response: null,
      asked_by: 'Admin Command', // Default for now
      status: 'awaiting_response',
      created_at: new Date().toISOString(),
      answered_at: null,
    };

    return {
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              inquiries: [...(ticket.inquiries || []), newInquiry],
              updated_at: new Date().toISOString(),
            }
          : ticket
      )
    };
  }),

  openRevertModal: (ticket) => set({ revertModalTicket: ticket }),
  
  closeRevertModal: () => set({ revertModalTicket: null }),
  
  setSelectedTicket: (ticketId) => set({ selectedTicketId: ticketId }),
}));
