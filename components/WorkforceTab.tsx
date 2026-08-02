"use client";

import { useState } from "react";

interface DispatchItem {
  id: string;
  category: string;
  ward: string;
  severity: string;
  description: string;
  status: "Pending Approval" | "Dispatched" | "Locked";
  assignedTeam?: string;
  time: string;
}

export default function WorkforceConsole() {
  const [queue, setQueue] = useState<DispatchItem[]>([
    { id: "SOS-102", category: "Evacuation", ward: "Ward 1 (Old Panvel)", severity: "Critical", description: "15 families stranded near riverbank", status: "Pending Approval", time: "18:42 IST" },
    { id: "SOS-101", category: "Waterlogging", ward: "Ward 3 (Station Road)", severity: "High", description: "3ft water blocking main intersection", status: "Pending Approval", time: "18:35 IST" },
    { id: "SOS-104", category: "Medical Emergency", ward: "Ward 4 (Kalamboli)", severity: "High", description: "Elderly resident requires oxygen transport", status: "Dispatched", assignedTeam: "EMS Ambulance 3", time: "18:28 IST" },
  ]);

  const [selectedIncident, setSelectedIncident] = useState<DispatchItem | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("NDRF Unit 1 (5 Members)");

  // Handle Approve & Dispatch Lock Flow
  const handleApproveDispatch = () => {
    if (!selectedIncident) return;

    setQueue((prev) =>
      prev.map((item) =>
        item.id === selectedIncident.id
          ? { ...item, status: "Dispatched", assignedTeam: selectedTeam }
          : item
      )
    );

    setSelectedIncident(null);
    alert(`APPROVED & DISPATCHED: ${selectedTeam} assigned to ${selectedIncident.id}!`);
  };

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-5 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D7DEE7] pb-3.5 gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#1F3A5F]">Workforce Control Console</h2>
          <p className="text-xs text-slate-500">Dispatch Approval Flow, Resource Locking & Response Management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-[#2E7D32] border border-emerald-300">
            ● DISPATCH SYSTEM ACTIVE
          </span>
        </div>
      </div>

      {/* Pending Dispatch Approval Queue */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">
          Pending Emergency Dispatch Approvals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 border rounded flex flex-col justify-between space-y-3 transition-colors ${
                item.status === "Pending Approval"
                  ? "bg-red-50/50 border-red-200"
                  : "bg-[#FAFCFE] border-[#D7DEE7]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#1F3A5F]">{item.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    item.severity === "Critical" ? "bg-red-100 text-[#B91C1C] border border-red-300" : "bg-amber-100 text-[#D97706] border border-amber-300"
                  }`}>
                    {item.severity}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-1.5">{item.category} — <span className="font-normal text-slate-600">{item.ward}</span></h4>
                <p className="text-xs text-slate-600 mt-1 leading-normal">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px] font-mono">{item.time}</span>
                {item.status === "Pending Approval" ? (
                  <button
                    onClick={() => setSelectedIncident(item)}
                    className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white text-xs font-semibold px-3 py-1 rounded transition-colors shadow-2xs"
                  >
                    Approve & Dispatch →
                  </button>
                ) : (
                  <span className="text-[#2E7D32] font-semibold text-xs flex items-center gap-1">
                    ✓ Dispatched ({item.assignedTeam})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatch Approval Modal Dialog */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D7DEE7] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-[#D7DEE7] pb-2.5 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Approve Dispatch Request</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 bg-[#FAFCFE] p-3 border border-[#D7DEE7] rounded text-slate-700">
              <div><strong className="text-slate-900">Incident ID:</strong> {selectedIncident.id}</div>
              <div><strong className="text-slate-900">Category:</strong> {selectedIncident.category}</div>
              <div><strong className="text-slate-900">Target Ward:</strong> {selectedIncident.ward}</div>
              <div><strong className="text-slate-900">Severity Level:</strong> <span className="text-[#B91C1C] font-bold">{selectedIncident.severity}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">Select Field Unit to Deploy:</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-white border border-[#D7DEE7] p-2 rounded text-xs text-slate-800 font-medium"
              >
                <option value="NDRF Unit 1 (5 Members - Boat Active)">NDRF Unit 1 (5 Members - Boat Active)</option>
                <option value="EMS Ambulance 3 (Paramedics Ready)">EMS Ambulance 3 (Paramedics Ready)</option>
                <option value="Municipal Dewatering Crew B">Municipal Dewatering Crew B</option>
                <option value="Fire & Rescue Response Team 2">Fire & Rescue Response Team 2</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D7DEE7]">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-3 py-1.5 border border-[#D7DEE7] rounded text-slate-600 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveDispatch}
                className="px-4 py-1.5 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-semibold"
              >
                Confirm & Lock Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Field Officers Roster Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">
          Active Field Roster & Team Status
        </h3>

        <div className="overflow-x-auto border border-[#D7DEE7] rounded">
          <table className="w-full text-left text-xs table-admin">
            <thead className="bg-[#1F3A5F] text-white font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-3.5 py-2.5">Officer ID</th>
                <th className="px-3.5 py-2.5">Name</th>
                <th className="px-3.5 py-2.5">Unit / Role</th>
                <th className="px-3.5 py-2.5">Assigned Sector</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
              {[
                { id: "OFF-101", name: "Insp. R. Sharma", unit: "NDRF Unit 1", sector: "Ward 1 (Old Panvel)", status: "On Field" },
                { id: "OFF-102", name: "Dr. A. Verma", unit: "EMS Ambulance 3", sector: "Ward 4 (Kalamboli)", status: "Dispatched" },
                { id: "OFF-103", name: "S. Kadam", unit: "Civil Defense", sector: "Ward 5 (Khandeshwar)", status: "Standby" },
                { id: "OFF-104", name: "V. Patil", unit: "Municipal Crew B", sector: "Ward 3 (Station Rd)", status: "On Field" },
              ].map((row) => (
                <tr key={row.id}>
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{row.id}</td>
                  <td className="px-3.5 py-2.5 font-medium text-slate-900">{row.name}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">{row.unit}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{row.sector}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      row.status === "On Field" || row.status === "Dispatched"
                        ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300"
                        : "bg-slate-100 text-slate-700 border border-slate-300"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <button className="text-[#1565C0] hover:underline font-semibold text-[11px]">Update Assignment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}