export type TicketStatus = 'given' | 'in_progress' | 'proceeded' | 'reverted';
export type TicketSource = 'workforce' | 'twin_aggregator';
export type InquiryStatus = 'awaiting_response' | 'answered' | 'overdue';

export interface TicketInquiry {
  id: string;
  ticket_id: string;
  question: string;
  response?: string | null;
  asked_by: string;
  status: InquiryStatus;
  created_at: string;
  answered_at?: string | null;
}

export interface Ticket {
  id: string;
  order_name: string;
  type: string;
  department: string;
  status: TicketStatus;
  issued_by: string;
  executed_by: string;
  source: TicketSource;
  revert_reason?: string | null;
  created_at: string;
  updated_at: string;
  inquiries?: TicketInquiry[];
}

export interface AuditLogFilters {
  search: string;
  department: string;
  type: string;
  status: TicketStatus | 'all';
}
