// @ts-nocheck
"use client";

import React from "react";
import Header from "../../components/Header";
import ResourceLedger from "../../components/ResourceLedger";

export default function ResourcesPage() {
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
            className="px-4 py-2.5 font-medium border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Workforce Console & Dispatch
          </a>
          <a
            href="/resources"
            className="px-4 py-2.5 font-medium border-b-2 border-white bg-[#1F3A5F] text-white transition-colors whitespace-nowrap"
          >
            Resource & Equipment Ledger
          </a>
          <a
            href="/audit"
            className="px-4 py-2.5 font-medium border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Audit & System Logs
          </a>
        </div>
      </div>

      {/* Main Operational Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Metric Cards Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Active Incidents", val: "6", status: "Critical", color: "text-[#B91C1C]" },
            { label: "Personnel Deployed", val: "18", status: "On Field", color: "text-[#1F3A5F]" },
            { label: "Relief Camps", val: "4 Open", status: "1,200 Capacity", color: "text-[#2E7D32]" },
            { label: "Flood Risk Index", val: "Level 3", status: "High Risk", color: "text-[#D97706]" },
            { label: "Medical Teams", val: "5 Active", status: "Standby", color: "text-[#1565C0]" },
            { label: "Road Closures", val: "2 Sector", status: "Panvel-Old", color: "text-[#B91C1C]" },
            { label: "Weather Alert", val: "Heavy Rain", status: "IMD Red Alert", color: "text-[#D97706]" },
            { label: "Comms Network", val: "99.4%", status: "VHF Active", color: "text-[#2E7D32]" },
          ].map((m, idx) => (
            <div key={idx} className="p-3 bg-[#FFFFFF] border border-[#D7DEE7] rounded text-left shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight block">{m.label}</span>
              <span className={`text-lg font-semibold ${m.color} block mt-0.5 font-mono`}>{m.val}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{m.status}</span>
            </div>
          ))}
        </div>

        <ResourceLedger />
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
