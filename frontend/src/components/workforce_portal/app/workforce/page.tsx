// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import OfficerDrawer from "../../components/OfficerDrawer";
import { fetchOfficers, fetchSOSRequests, dispatchUnit } from "../../lib/api";
import { Officer, SOSRequest } from "../../lib/mockData";

export default function WorkforcePage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [queue, setQueue] = useState<SOSRequest[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<SOSRequest | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("NDRF Unit 1 (Panvel Base)");

  useEffect(() => {
    async function loadData() {
      const officerData = await fetchOfficers();
      const sosData = await fetchSOSRequests();
      setOfficers(officerData);
      setQueue(sosData);
    }
    loadData();
  }, []);

  const handleRowClick = (officer: Officer) => {
    setSelectedOfficer(officer);
    setIsDrawerOpen(true);
  };

  const handleDispatch = async () => {
    if (!selectedIncident) return;
    const targetIncident = selectedIncident;
    const teamToAssign = selectedTeam;

    setQueue((prev) =>
      prev.map((item) =>
        item.id === targetIncident.id
          ? { ...item, status: "Dispatched", assignedTeam: teamToAssign }
          : item
      )
    );
    setSelectedIncident(null);

    await dispatchUnit({
      incidentId: targetIncident.id,
      assignedTeam: teamToAssign,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "On Field":
      case "Operational":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-[#2E7D32] border border-emerald-300">
            On Field
          </span>
        );
      case "Dispatched":
      case "In Use":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-[#1565C0] border border-blue-300">
            Dispatched
          </span>
        );
      case "Standby":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-[#D97706] border border-amber-300">
            Standby
          </span>
        );
      case "Critical":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-[#B91C1C] border border-red-300">
            Critical
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

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
            Workforce Console & Dispatch
          </a>
          <a
            href="/resources"
            className="px-4 py-2.5 font-medium border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
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
            <div key={idx} className="p-3 bg-white border border-[#D7DEE7] rounded text-left shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight block">{m.label}</span>
              <span className={`text-lg font-semibold ${m.color} block mt-0.5 font-mono`}>{m.val}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{m.status}</span>
            </div>
          ))}
        </div>

        {/* Workforce Control Console Main Box */}
        <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-5 shadow-2xs">
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

          {/* Pending Dispatch Approvals Section */}
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
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
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

          {/* Active Field Roster Table Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wide">
                Active Field Roster & Team Status
              </h3>
              <span className="text-[11px] text-slate-500 italic">
                (Click any row to open Officer Detail Drawer)
              </span>
            </div>

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
                  {officers.map((officer) => (
                    <tr
                      key={officer.id}
                      onClick={() => handleRowClick(officer)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F] group-hover:text-[#1565C0]">
                        {officer.id}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {officer.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">{officer.role}</td>
                      <td className="px-3.5 py-2.5 text-slate-700 font-medium">
                        {officer.sector}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {getStatusBadge(officer.status)}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(officer);
                          }}
                          className="text-[#1565C0] hover:underline font-semibold text-xs flex items-center gap-1"
                        >
                          View Profile →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Dispatch Assignment */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D7DEE7] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Approve Emergency Dispatch</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
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

      {/* Slide-In Officer Detail Drawer */}
      <OfficerDrawer
        officer={selectedOfficer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

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
