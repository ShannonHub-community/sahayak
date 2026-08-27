// @ts-nocheck
"use client";

import { useState } from "react";

export default function MissionControl() {
  const [missions] = useState([
    { id: "MIS-201", title: "Flood Evacuation Operation", sector: "Old Panvel (Ward 1)", priority: "Critical", team: "NDRF 5th Battalion Alpha", eta: "12 mins", status: "In Progress", timestamp: "18:42 IST" },
    { id: "MIS-202", title: "Emergency Oxygen Cylinder Delivery", sector: "Kalamboli (Ward 4)", priority: "High", team: "EMS Medical Unit 3", eta: "8 mins", status: "In Progress", timestamp: "18:28 IST" },
    { id: "MIS-203", title: "Dewatering Sludge Pumping", sector: "Station Road (Ward 3)", priority: "High", team: "Panvel Fire Squad 2", eta: "15 mins", status: "Pending", timestamp: "18:15 IST" },
  ]);

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-4 text-slate-800 font-sans shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#D7DEE7] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1F3A5F]">Mission Control & Operations Dispatch</h2>
          <p className="text-xs text-slate-500">Live Mission Queue, Tactical ETA Tracking & Command Dispatch</p>
        </div>
        <button className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white text-xs font-semibold px-3 py-1.5 rounded">
          + Launch New Mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {missions.map((m) => (
          <div key={m.id} className="p-3.5 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-bold text-[#1F3A5F]">{m.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                m.priority === "Critical" ? "bg-red-100 text-[#B91C1C]" : "bg-amber-100 text-[#D97706]"
              }`}>
                {m.priority}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-900">{m.title}</h4>
            <p className="text-[11px] text-slate-600">Sector: <strong>{m.sector}</strong></p>
            <p className="text-[11px] text-slate-600">Assigned: <strong>{m.team}</strong></p>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
              <span>ETA: <strong className="text-[#1565C0]">{m.eta}</strong></span>
              <span className="font-mono">{m.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}