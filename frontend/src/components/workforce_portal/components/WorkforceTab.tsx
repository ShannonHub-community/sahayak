// @ts-nocheck
"use client";

import React, { useState } from "react";
import { mockOfficers, Officer } from "../lib/mockData";

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

interface WorkforceConsoleProps {
  onSelectOfficer?: (officer: Officer) => void;
}

export default function WorkforceConsole({ onSelectOfficer }: WorkforceConsoleProps = {}) {
  const [queue, setQueue] = useState<DispatchItem[]>([
    { id: "SOS-102", category: "Evacuation", ward: "Ward 1 (Old Panvel)", severity: "Critical", description: "15 families stranded near riverbank", status: "Pending Approval", time: "18:42 IST" },
    { id: "SOS-101", category: "Waterlogging", ward: "Ward 3 (Station Road)", severity: "High", description: "3ft water blocking main intersection", status: "Pending Approval", time: "18:35 IST" },
    { id: "SOS-104", category: "Medical Emergency", ward: "Ward 4 (Kalamboli)", severity: "High", description: "Elderly resident requires oxygen transport", status: "Dispatched", assignedTeam: "EMS Ambulance 3", time: "18:28 IST" },
  ]);

  const [selectedIncident, setSelectedIncident] = useState<DispatchItem | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("NDRF Unit 1 (Panvel Base)");

  const handleDispatch = () => {
    if (!selectedIncident) return;
    setQueue((prev) =>
      prev.map((item) =>
        item.id === selectedIncident.id
          ? { ...item, status: "Dispatched", assignedTeam: selectedTeam }
          : item
      )
    );
    setSelectedIncident(null);
  };

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-5 text-slate-800 font-sans shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D7DEE7] pb-3.5 gap-2">
        <div>
          <h2 className="text-base font-bold text-[#1F3A5F]">Workforce Control Console</h2>
          <p className="text-xs text-slate-500">Dispatch Approval Flow, Resource Locking & Response Management</p>
        </div>
        <span className="bg-emerald-100 text-[#2E7D32] border border-emerald-300 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
          DISPATCH SYSTEM ACTIVE
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wide">
          Pending Emergency Dispatch Approvals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 border rounded space-y-2 text-xs flex flex-col justify-between ${
                item.severity === "Critical"
                  ? "bg-red-50/50 border-red-200"
                  : "bg-amber-50/50 border-amber-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[#1F3A5F] text-xs">{item.id}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      item.severity === "Critical"
                        ? "bg-red-100 text-[#B91C1C]"
                        : "bg-amber-100 text-[#D97706]"
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900">{item.category} — <span className="font-normal text-slate-600">{item.ward}</span></h4>
                <p className="text-slate-600 mt-1 text-[11px] line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                {item.status === "Pending Approval" ? (
                  <button
                    onClick={() => setSelectedIncident(item)}
                    className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white px-3 py-1 rounded font-medium text-xs transition-colors"
                  >
                    Approve & Dispatch →
                  </button>
                ) : (
                  <span className="text-[#2E7D32] font-semibold text-[11px]">
                    ✓ Dispatched ({item.assignedTeam})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wide">
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
              {mockOfficers.map((officer) => (
                <tr
                  key={officer.id}
                  onClick={() => onSelectOfficer?.(officer)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F] group-hover:text-[#1565C0]">
                    {officer.id}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">
                    {officer.name}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">{officer.role}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{officer.sector}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        officer.status === "On Field"
                          ? "bg-emerald-100 text-[#2E7D32]"
                          : officer.status === "Dispatched"
                          ? "bg-blue-100 text-[#1565C0]"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {officer.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOfficer?.(officer);
                      }}
                      className="text-[#1565C0] hover:underline font-semibold"
                    >
                      Inspect Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D7DEE7] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Approve Emergency Dispatch</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-2 bg-[#FAFCFE] p-3 border border-[#D7DEE7] rounded">
              <p><strong>Incident ID:</strong> <span className="font-mono">{selectedIncident.id}</span></p>
              <p><strong>Type:</strong> {selectedIncident.category} ({selectedIncident.severity})</p>
              <p><strong>Location:</strong> {selectedIncident.ward}</p>
              <p><strong>Details:</strong> {selectedIncident.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Select Response Unit:</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
              >
                <option value="NDRF Unit 1 (Panvel Base)">NDRF Unit 1 (Panvel Base)</option>
                <option value="Panvel Municipal Fire Squad 2">Panvel Municipal Fire Squad 2</option>
                <option value="EMS Ambulance 3">EMS Ambulance 3</option>
                <option value="Civil Defense Rapid Unit">Civil Defense Rapid Unit</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D7DEE7]">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-3 py-1.5 border border-[#D7DEE7] rounded text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                className="px-4 py-1.5 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-semibold transition-colors"
              >
                Confirm & Lock Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}