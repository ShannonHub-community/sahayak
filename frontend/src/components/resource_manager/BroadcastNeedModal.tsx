"use client";

import React, { useState } from 'react';
import { useResourceStore } from './useResourceStore';
import { ResourceCategory, ResourceSubtype } from './types';
import { X, Megaphone } from 'lucide-react';

interface BroadcastNeedModalProps {
  onClose: () => void;
}

export const BroadcastNeedModal: React.FC<BroadcastNeedModalProps> = ({ onClose }) => {
  const broadcastNeed = useResourceStore(state => state.broadcastNeed);
  const [category, setCategory] = useState<ResourceCategory>('ration');
  const [subtype, setSubtype] = useState<string>('Drinking Water');
  const [quantity, setQuantity] = useState<number>(100);

  const handleBroadcast = () => {
    broadcastNeed(category, subtype as unknown as ResourceSubtype, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded shadow-xl w-full max-w-md border border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
            <Megaphone className="w-5 h-5 text-blue-500" /> Broadcast Need
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all duration-150">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This will publish a high-priority alert to the Citizen Portal, requesting immediate donations for the selected resource.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Category</label>
            <select className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
              <option value="personnel" className="bg-zinc-900 text-zinc-100">Personnel</option>
              <option value="ration" className="bg-zinc-900 text-zinc-100">Ration</option>
              <option value="medical_equipment" className="bg-zinc-900 text-zinc-100">Medical Equipment</option>
              <option value="vehicle" className="bg-zinc-900 text-zinc-100">Vehicle</option>
              <option value="shelter_object" className="bg-zinc-900 text-zinc-100">Shelter Object</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Subtype</label>
            <input type="text" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={subtype} onChange={(e) => setSubtype(e.target.value)} placeholder="e.g. Drinking Water" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Target Quantity</label>
            <input type="number" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none font-mono" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} />
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-800/50">
          <button onClick={onClose} className="px-4 py-2 rounded border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-all duration-150">
            Cancel
          </button>
          <button onClick={handleBroadcast} className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-150 flex items-center gap-2">
            Confirm Broadcast
          </button>
        </div>
      </div>
    </div>
  );
};
