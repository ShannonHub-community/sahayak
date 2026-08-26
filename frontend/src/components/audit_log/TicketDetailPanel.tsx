import React from 'react';
import { Ticket } from './types';
import { InquiryThread } from './InquiryThread';
import { AlertTriangle } from 'lucide-react';

interface TicketDetailPanelProps {
  ticket: Ticket;
}

export const TicketDetailPanel: React.FC<TicketDetailPanelProps> = ({ ticket }) => {
  return (
    <div className="p-6 bg-slate-50 border-x border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Metadata */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 mb-4">Order Details</h3>
          
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-slate-500">Ticket ID</dt>
              <dd className="mt-1 text-sm text-slate-800 font-mono bg-white p-2 rounded border border-slate-200">{ticket.id}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-slate-500">Order Type</dt>
              <dd className="mt-1 text-sm text-slate-800">{ticket.type}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-slate-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {new Date(ticket.updated_at).toLocaleString()}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Issuing Authority</dt>
              <dd className="mt-1 text-sm text-slate-800">{ticket.issued_by}</dd>
            </div>
          </dl>

          {/* Reverted Callout */}
          {ticket.status === 'reverted' && ticket.revert_reason && (
            <div className="mt-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-rose-800">Order Reverted (Stop Signal Sent)</h3>
                  <div className="mt-2 text-sm text-rose-700">
                    <p>{ticket.revert_reason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Inquiries */}
        <div>
          <InquiryThread ticketId={ticket.id} inquiries={ticket.inquiries || []} />
        </div>
      </div>
    </div>
  );
};
