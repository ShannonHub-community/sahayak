"use client";

import React, { useState, useEffect } from "react";

export default function Header() {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
          " | " +
          now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) +
          " IST"
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-[#1F3A5F] text-white border-b-4 border-[#1565C0] shadow-xs">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-lg text-white">
            🏛️
          </div>
          <div>
            <span className="text-[11px] font-medium tracking-wider text-slate-300 uppercase block leading-none">
              Government of Maharashtra • District Disaster Management Authority
            </span>
            <h1 className="font-bold text-lg tracking-tight text-white mt-1 leading-tight">
              District Emergency Operations Centre (DEOC)
            </h1>
            <p className="text-xs text-slate-300">Panvel Sub-Division, District Raigad</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs border-t md:border-t-0 md:border-l border-white/20 pt-2 md:pt-0 md:pl-4">
          <div>
            <span className="text-slate-300 text-[10px] uppercase block font-semibold">Duty Officer</span>
            <span className="font-medium text-white">RDC / EOC In-Charge</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-300 text-[10px] uppercase block font-semibold">System Time</span>
            <span className="font-mono text-white font-medium">{currentTime || "Loading..."}</span>
          </div>
          <div>
            <span className="text-slate-300 text-[10px] uppercase block font-semibold">Status</span>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-800 text-emerald-100 border border-emerald-600">
              MONSOON WATCH (LEVEL-2)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}