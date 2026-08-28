"use client";

import React, { useEffect, useRef } from 'react';
import { InventoryMatrix } from './InventoryMatrix';
import { WorkforceQueue } from './WorkforceQueue';
import { AIInsightCards } from './AIInsightCards';
import { PublicNeedsBroadcast } from './PublicNeedsBroadcast';
import { Activity } from 'lucide-react';
import { useResourceStore } from './useResourceStore';

const ResourceManagerTab: React.FC = () => {
  const { resources, loadData, initWebSocket, isConnected, error } = useResourceStore();
  const activeItemCount = resources.length;
  const wsCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Fetch resources, insights, and queue from the backend on mount
    loadData();

    // Establish WebSocket connection for real-time updates
    wsCleanupRef.current = initWebSocket();

    return () => {
      // Clean up WebSocket on unmount
      wsCleanupRef.current?.();
    };
  }, [loadData, initWebSocket]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 p-4 gap-4 overflow-hidden text-zinc-900 dark:text-zinc-100">
      {/* Top Console Bar */}
      <div className="flex flex-col shrink-0 gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Sahayak Operations — Resource Ledger</h1>
            <p className="text-sm text-zinc-400 mt-1">Tracking {activeItemCount} active inventory assets and deployments across all zones.</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full shadow-sm ${isConnected ? 'bg-emerald-950/70 border-emerald-600/80' : 'bg-slate-800/70 border-slate-600/80'}`}>
            <Activity className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className={`text-xs font-bold tracking-wide ${isConnected ? 'text-emerald-300' : 'text-slate-300'}`}>
              {isConnected ? 'Live Sync Active' : 'Offline'}
            </span>
          </div>
        </div>
        
        {/* Offline warning banner */}
        {error && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md text-xs text-amber-700 dark:text-amber-400">
            {error}
          </div>
        )}
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
