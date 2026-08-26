"use client";

import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { BroadcastNeedModal } from './BroadcastNeedModal';

export const PublicNeedsBroadcast: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mt-4 p-4 border border-zinc-800 rounded bg-zinc-900 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-500" /> Public Needs Broadcast
          </h3>
          <p className="text-xs text-zinc-300">
            Publish deficit alerts directly to the Citizen Donation Portal to mobilize community support.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-all duration-150"
          >
            Broadcast to Donation Portal
          </button>
        </div>
      </div>

      {isModalOpen && <BroadcastNeedModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};
