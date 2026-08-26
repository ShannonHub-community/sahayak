"use client";

import React from 'react';
import { InventoryMatrix } from './InventoryMatrix';
import { WorkforceQueue } from './WorkforceQueue';
import { AIInsightCards } from './AIInsightCards';
import { PublicNeedsBroadcast } from './PublicNeedsBroadcast';
import { Activity } from 'lucide-react';
import { useResourceStore } from './useResourceStore';

const ResourceManagerTab: React.FC = () => {
  const activeItemCount = useResourceStore(state => state.resources.length);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 p-4 gap-4 overflow-hidden text-zinc-900 dark:text-zinc-100">
      {/* Top Console Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Sahayak Operations — Resource Ledger</h1>
          <p className="text-sm text-zinc-400 mt-1">Tracking {activeItemCount} active inventory assets and deployments across all zones.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/70 border border-emerald-600/80 rounded-full shadow-sm">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-300 tracking-wide">Live Sync Active</span>
        </div>
      </div>

      {/* Main 2-Panel Layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Center Panel - 70% */}
        <div className="flex-[7] min-w-0">
          <InventoryMatrix />
        </div>

        {/* Right Panel - 30% */}
        <div className="flex-[3] min-w-[320px] max-w-[400px] flex flex-col gap-6 overflow-y-auto pr-1">
          <div className="shrink-0 flex-[1] min-h-[250px]">
            <WorkforceQueue />
          </div>
          <div className="shrink-0">
            <AIInsightCards />
          </div>
          <div className="shrink-0">
            <PublicNeedsBroadcast />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagerTab;
