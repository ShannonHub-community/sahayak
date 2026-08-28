"use client";

import React, { useState } from 'react';
import { useResourceStore } from './useResourceStore';
import { X, CheckCircle, Package } from 'lucide-react';
import { WorkforceRequest } from './types';

interface HandoverModalProps {
  request: WorkforceRequest;
  onClose: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ request, onClose }) => {
  const { resources, completeHandover } = useResourceStore();
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  const matchingResources = resources.filter(
    r => r.category === request.requested_category && r.status === 'available'
  );

  const handleConfirm = () => {
    if (selectedResourceId) {
      completeHandover(request.id, selectedResourceId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded shadow-xl w-full max-w-lg border border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Dispatch Handover
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-200 transition-all duration-150">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="p-3 bg-zinc-800/50 rounded border border-zinc-700">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Request Details</h3>
            <p className="text-sm font-semibold text-zinc-100">{request.team_name} ({request.team_type})</p>
            <p className="text-xs text-zinc-300 mt-1">Requires: <span className="font-medium text-zinc-100 font-mono">{request.quantity}</span>x <span className="font-medium text-zinc-100">{request.requested_subtype}</span> in {request.zone}</p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Available Inventory</h3>
            {matchingResources.length === 0 ? (
              <p className="text-sm text-rose-300 p-3 bg-rose-950/40 border border-rose-800/60 rounded">
                No available stock matching this category.
              </p>
            ) : (
              <div className="max-h-[250px] overflow-y-auto flex flex-col gap-2 border border-zinc-700 rounded p-1">
                {matchingResources.map(res => (
                  <label key={res.id} className={`flex items-start gap-3 p-3 rounded cursor-pointer transition-all duration-150 ${selectedResourceId === res.id ? 'bg-emerald-950/40 border-emerald-800/60 border' : 'hover:bg-zinc-800/50 border border-transparent'}`}>
                    <input
                      type="radio"
                      name="resource"
                      value={res.id}
                      checked={selectedResourceId === res.id}
                      onChange={() => setSelectedResourceId(res.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-zinc-100">{res.name}</span>
                        <span className="text-xs font-medium text-zinc-400">Qty: <span className="font-mono">{res.quantity}</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                        <Package className="w-3 h-3" /> {res.subtype} • {res.location.zoneName}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-800/50 rounded-b">
          <button onClick={onClose} className="px-4 py-2 rounded border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-all duration-150">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!selectedResourceId}
            className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Confirm Allocation
          </button>
        </div>
      </div>
    </div>
  );
};
