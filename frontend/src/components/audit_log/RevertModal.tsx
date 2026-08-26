import React, { useState } from 'react';
import { Ticket } from './types';
import { useAuditLogStore } from './useAuditLogStore';
import { AlertTriangle, X } from 'lucide-react';

interface RevertModalProps {
  ticket: Ticket;
  isOpen: boolean;
}

export const RevertModal: React.FC<RevertModalProps> = ({ ticket, isOpen }) => {
  const [reason, setReason] = useState('');
  const { revertTicket, closeRevertModal } = useAuditLogStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) return;
    revertTicket(ticket.id, reason);
    closeRevertModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center text-rose-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold text-slate-800">Revert Order</h2>
          </div>
          <button 
            onClick={closeRevertModal}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            You are about to issue a stop-signal to halt the following operation. This action is logged permanently.
          </p>
          
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
            <div className="text-xs text-slate-500 mb-1">Target Order:</div>
            <div className="font-medium text-slate-800">{ticket.order_name}</div>
            <div className="mt-2 text-xs text-slate-500">Assigned Officer:</div>
            <div className="text-sm text-slate-700">{ticket.executed_by}</div>
          </div>

          <div>
            <label htmlFor="revert-reason" className="block text-sm font-medium text-slate-700 mb-2">
              Mandatory Revert Reason
            </label>
            <textarea
              id="revert-reason"
              rows={3}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 resize-none"
              placeholder="Provide specific operational reasoning for halting this order..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={closeRevertModal}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 border border-rose-600 disabled:bg-rose-900 disabled:text-rose-400 disabled:border-rose-900 disabled:cursor-not-allowed rounded-md transition-colors shadow-sm"
          >
            Confirm Revert & Send Stop Signal
          </button>
        </div>
      </div>
    </div>
  );
};
