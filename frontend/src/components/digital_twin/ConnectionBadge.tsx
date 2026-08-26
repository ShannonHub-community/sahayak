"use client";

import React from "react";
import { useTwinStore } from "@/store/twinStore";

export function ConnectionBadge() {
  const isConnected = useTwinStore((state) => state.isConnected);
  const lastUpdated = useTwinStore((state) => state.lastUpdated);

  if (isConnected) {
    return null;
  }

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : "Never";

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-amber-900/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-amber-100 shadow-xl border border-amber-500/40 animate-pulse">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <span>Reconnecting — Last updated: {formattedTime}</span>
    </div>
  );
}

export default ConnectionBadge;
