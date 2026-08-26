import React from 'react';
import { AuditLogFilterBar } from './AuditLogFilterBar';
import { AuditLogTable } from './AuditLogTable';
import { RevertModal } from './RevertModal';
import { useAuditLogStore } from './useAuditLogStore';

export default function AuditLogTab() {
  const { revertModalTicket } = useAuditLogStore();

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">System Audit Trail</h2>
        <p className="text-slate-500 text-sm mt-1">
          Immutable ledger of all commands issued, threshold triggers, and workforce operations. Monitor real-time status and issue stop-signals.
        </p>
      </div>

      <div className="flex flex-col flex-1">
        <AuditLogFilterBar />
        <AuditLogTable />
      </div>

      {revertModalTicket && (
        <RevertModal 
          ticket={revertModalTicket} 
          isOpen={!!revertModalTicket} 
        />
      )}
    </div>
  );
}
