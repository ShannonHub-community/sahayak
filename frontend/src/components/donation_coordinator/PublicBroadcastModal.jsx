import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { X, Radio, Send, Bell } from 'lucide-react';
import { LOCATIONS } from '../mock/initialData';

export const PublicBroadcastModal = () => {
  const { isPublicBroadcastModalOpen, setIsPublicBroadcastModalOpen, publicNeeds, broadcastNeed } = useLedger();
  const [needTitle, setNeedTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Sector 4');
  const [urgency, setUrgency] = useState('Critical');

  if (!isPublicBroadcastModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="font-bold text-base text-white">Broadcast Public Emergency Need</h2>
          </div>
          <button
            onClick={() => setIsPublicBroadcastModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs">
          <p className="text-slate-600">
            Publish urgent requirements directly to the SAHAYAK public mobile app, citizen alert feeds, and NGO portals.
          </p>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Existing Un-broadcasted Public Needs:</label>
            {publicNeeds.filter(n => !n.isBroadcasted).map(need => (
              <div key={need.id} className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block">{need.title}</span>
                  <span className="text-slate-600 text-[11px]">{need.description}</span>
                </div>
                <button
                  onClick={() => {
                    broadcastNeed(need.id);
                    setIsPublicBroadcastModalOpen(false);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1 rounded shadow cursor-pointer shrink-0 ml-2"
                >
                  Broadcast
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsPublicBroadcastModalOpen(false)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
