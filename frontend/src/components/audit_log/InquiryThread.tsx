import React, { useState } from 'react';
import { TicketInquiry } from './types';
import { useAuditLogStore } from './useAuditLogStore';
import { Send, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface InquiryThreadProps {
  ticketId: string;
  inquiries: TicketInquiry[];
}

export const InquiryThread: React.FC<InquiryThreadProps> = ({ ticketId, inquiries }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const { addInquiry } = useAuditLogStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    
    addInquiry(ticketId, newQuestion);
    setNewQuestion('');
  };

  const getStatusBadge = (status: TicketInquiry['status']) => {
    switch (status) {
      case 'answered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Answered
          </span>
        );
      case 'awaiting_response':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Awaiting Response
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium text-slate-800 mb-4">Department Inquiries</h3>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[300px] pr-2 custom-scrollbar">
        {inquiries.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-4">No inquiries have been made for this order.</p>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-slate-800">{inquiry.asked_by}</div>
                {getStatusBadge(inquiry.status)}
              </div>
              <p className="text-slate-700 mb-2">{inquiry.question}</p>
              <div className="text-xs text-slate-500 mb-3">
                {new Date(inquiry.created_at).toLocaleString()}
              </div>

              {inquiry.response && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 ml-4 mt-2">
                  <div className="font-medium text-slate-700 mb-1 flex items-center">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2"></span>
                    Field Response
                  </div>
                  <p className="text-slate-800">{inquiry.response}</p>
                  {inquiry.answered_at && (
                    <div className="text-xs text-slate-500 mt-2">
                      {new Date(inquiry.answered_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="mt-auto">
        <label htmlFor="inquiry-input" className="sr-only">Send Inquiry</label>
        <div className="relative flex items-center">
          <input
            id="inquiry-input"
            type="text"
            className="w-full bg-white border border-slate-300 rounded-md py-2 pl-3 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Ask a question or request status..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newQuestion.trim()}
            className="absolute right-2 p-1 text-slate-500 hover:text-emerald-600 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
