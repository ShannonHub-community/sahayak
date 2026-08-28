import React, { useEffect, useRef } from 'react';
import { AuditLogFilterBar } from './AuditLogFilterBar';
import { AuditLogTable } from './AuditLogTable';
import { RevertModal } from './RevertModal';
import { useAuditLogStore } from './useAuditLogStore';

export default function AuditLogTab() {
  const { revertModalTicket, loadTickets, initWebSocket, isConnected, error } = useAuditLogStore();
  const wsCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Fetch tickets from the backend on mount
    loadTickets();

    // Establish WebSocket connection for real-time updates
    wsCleanupRef.current = initWebSocket();

    return () => {
      // Clean up WebSocket on unmount
      wsCleanupRef.current?.();
    };
  }, [loadTickets, initWebSocket]);

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">System Audit Trail</h2>
            <p className="text-slate-500 text-sm mt-1">
              Immutable ledger of all commands issued, threshold triggers, and workforce operations. Monitor real-time status and issue stop-signals.
            </p>
          </div>

          {/* Connection status indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs text-slate-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Offline warning banner */}
        {error && (
          <div className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
            {error}
          </div>
        )}
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
