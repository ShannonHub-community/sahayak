// @ts-nocheck
"use client";

import React from "react";
import Header from "../../components/Header";
import WorkforceDashboard from "../../components/WorkforceDashboard";

export default function WorkforcePage() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-800 font-sans flex flex-col">
      {/* Official Government Header */}
      <Header />

      {/* Sub-Navigation Strip */}
      <div className="bg-[#182C48] border-t border-white/10 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 text-xs overflow-x-auto">
          <a
            href="/"
            className="px-4 py-2.5 font-medium border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Control Room Dashboard
          </a>
          <a
            href="/workforce"
            className="px-4 py-2.5 font-medium border-b-2 border-white bg-[#1F3A5F] text-white transition-colors whitespace-nowrap"
          >
            Workforce Console &amp; Dispatch
          </a>
          <a
            href="/resources"
            className="px-4 py-2.5 font-medium border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Resource &amp; Equipment Ledger
          </a>
          <a
            href="/audit"
            className="px-4 py-2.5 font-medium border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Audit &amp; System Logs
          </a>
        </div>
      </div>

      {/* Main Operational Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        <WorkforceDashboard />
      </main>

      {/* Footer */}
      <footer className="bg-[#182C48] text-slate-300 text-xs border-t border-[#D7DEE7] py-3 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p>© Government of Maharashtra • District Disaster Management Authority (DDMA)</p>
          <p className="text-slate-400 font-mono text-[11px]">DEOC Portal v4.2</p>
        </div>
      </footer>
    </div>
  );
}
