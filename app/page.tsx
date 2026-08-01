"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function Home() {
  const [filter, setFilter] = useState<string>("ALL");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sleek Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 text-red-500 p-2.5 rounded-xl border border-red-500/30 animate-pulse">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SAHAYAK <span className="text-red-500 font-mono text-sm tracking-widest ml-1">[GOV PORTAL]</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                LIVE MONITORING
              </span>
            </div>
            <p className="text-xs text-slate-400">Panvel Command Center • Emergency Realtime Pipeline</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all shadow-lg shadow-red-600/20 cursor-pointer">
            📻 Broadcast Emergency Alert
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Realtime Emergency KPI Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active SOS Calls</p>
              <h2 className="text-3xl font-black text-white mt-1">6</h2>
              <span className="text-[10px] text-emerald-400 font-medium">↑ 2 new in last 10 mins</span>
            </div>
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-xl">
              ⚠️
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Panvel Flood Risk</p>
              <h2 className="text-3xl font-black text-amber-400 mt-1">HIGH</h2>
              <span className="text-[10px] text-amber-400 font-medium">Ward 4 & Kalamboli High Risk</span>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 text-xl">
              🌊
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Responders On Field</p>
              <h2 className="text-3xl font-black text-blue-400 mt-1">18</h2>
              <span className="text-[10px] text-blue-400 font-medium">3 NDRF Teams Active</span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-xl">
              🚒
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Relief Shelters</p>
              <h2 className="text-3xl font-black text-emerald-400 mt-1">4 Open</h2>
              <span className="text-[10px] text-slate-400 font-medium">Capacity: 1,200 beds</span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-xl">
              🏥
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid (Map + Side Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-sm font-bold text-slate-200">Panvel Sector Digital Twin Map</span>
              </div>
              <div className="flex items-center gap-2">
                {["ALL", "CRITICAL", "WATERLOGGING"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                      filter === f
                        ? "bg-slate-700 text-white shadow"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
              <MapView />
            </div>
          </div>

          {/* Incident Feed Sidebar (1/3 width) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  Live SOS Dispatch Queue
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">6 Records</span>
              </div>

              {/* Feed Items */}
              <div className="mt-4 space-y-3 max-h-120 overflow-y-auto pr-1">
                {[
                  { id: "SOS-02", title: "Stranded Citizens near Old Panvel", status: "Critical", time: "2 mins ago" },
                  { id: "SOS-01", title: "Waterlogging at Station Road", status: "High", time: "5 mins ago" },
                  { id: "SOS-04", title: "Medical Emergency - Kalamboli", status: "High", time: "12 mins ago" },
                  { id: "SOS-03", title: "Submerged Road near Khandeshwar", status: "Medium", time: "18 mins ago" },
                ].map((item) => (
                  <div key={item.id} className="p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                        {item.id}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 mt-2 group-hover:text-white">{item.title}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        item.status === "Critical" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {item.status} Severity
                      </span>
                      <button className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold">Dispatch Team →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 text-center">
              <p className="text-[11px] text-slate-500">Sahayak Vibe-Coding Dashboard • Panvel Ward 1-8</p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}