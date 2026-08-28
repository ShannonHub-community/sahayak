"use client";

import React, { useState } from 'react';
import { useResourceStore } from './useResourceStore';
import { HandoverModal } from './HandoverModal';
import { RadioReceiver } from 'lucide-react';
import { WorkforceRequest } from './types';

export const WorkforceQueue: React.FC = () => {
  const requests = useResourceStore(state => state.workforceRequests);
  const [selectedRequest, setSelectedRequest] = useState<WorkforceRequest | null>(null);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-rose-950/70 text-rose-300 border-rose-600/80';
      case 'high': return 'bg-amber-950/70 text-amber-300 border-amber-600/80';
      case 'medium': return 'bg-blue-950/70 text-blue-300 border-blue-600/80';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-600';
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-zinc-900 rounded border border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-100">
            <RadioReceiver className="w-4 h-4 text-emerald-600" /> Field Requests
          </h2>
          <span className="text-xs font-bold bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {requests.length === 0 ? (
            <div className="text-center p-4 text-xs text-zinc-400">
              No active field requests.
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="p-3 border border-zinc-800 rounded shadow-sm hover:border-zinc-600 transition-all duration-150 bg-zinc-900/80">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-zinc-100">{req.team_name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${getUrgencyColor(req.urgency)}`}>
                    {req.urgency}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 mb-3 space-y-1">
                  <p><span className="font-semibold text-zinc-400">Needs:</span> <span className="font-mono">{req.quantity}</span>x {req.requested_subtype}</p>
                  <p><span className="font-semibold text-zinc-400">Zone:</span> {req.zone}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">{new Date(req.timestamp).toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="w-full py-1.5 text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900/80 rounded transition-all duration-150"
                >
                  Handover Item
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <HandoverModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </>
  );
};
