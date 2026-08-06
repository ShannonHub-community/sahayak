"use client";

import React, { useState } from "react";

export default function AuditLogs() {
  const [logs] = useState([
    { id: "LOG-901", action: "Resource Lock Approved", user: "Officer R. Sharma", target: "NDRF Unit 1 -> SOS-102", timestamp: "18:42:10 IST", ip: "192.168.1.15" },
    { id: "LOG-902", action: "Emergency Level Raised", user: "Duty Officer (RDC)", target: "Panvel Sector 4", timestamp: "18:30:04 IST", ip: "192.168.1.10" },
    { id: "LOG-903", action: "Dewatering Pump Allocation", user: "Insp. V. Patil", target: "Station Road (Ward 3)", timestamp: "18:15:22 IST", ip: "192.168.1.22" },
    { id: "LOG-904", action: "AI Action Approved", user: "Officer R. Sharma", target: "AI Recommendation #42", timestamp: "17:55:00 IST", ip: "192.168.1.15" },
  ]);

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-4 text-slate-800 font-sans shadow-2xs">
      <div className="border-b border-[#D7DEE7] pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-[#1F3A5F]">System & Operational Audit Logs</h2>
          <p className="text-xs text-slate-500">Immutable Activity Trail of User Decisions, Dispatches & System Events</p>
        </div>
        <button className="bg-white border border-[#D7DEE7] text-slate-700 text-xs font-semibold px-3 py-1.5 rounded hover:bg-slate-50">
          📥 Export Log CSV
        </button>
      </div>

      <div className="overflow-x-auto border border-[#D7DEE7] rounded">
        <table className="w-full text-left text-xs table-admin">
          <thead className="bg-[#1F3A5F] text-white font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-3.5 py-2.5">Log ID</th>
              <th className="px-3.5 py-2.5">Action Performed</th>
              <th className="px-3.5 py-2.5">User / Officer</th>
              <th className="px-3.5 py-2.5">Target Record</th>
              <th className="px-3.5 py-2.5">Timestamp</th>
              <th className="px-3.5 py-2.5">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{log.id}</td>
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{log.action}</td>
                <td className="px-3.5 py-2.5 text-slate-700">{log.user}</td>
                <td className="px-3.5 py-2.5 font-mono text-slate-600">{log.target}</td>
                <td className="px-3.5 py-2.5 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                <td className="px-3.5 py-2.5 font-mono text-slate-500 text-[11px]">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}