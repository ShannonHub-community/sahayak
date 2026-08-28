// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Officer } from "../lib/mockData";
import { markOfficerOffline } from "../lib/api";

interface OfficerDrawerProps {
  officer: Officer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OfficerDrawer({ officer: initialOfficer, isOpen, onClose }: OfficerDrawerProps) {
  const [officer, setOfficer] = useState<Officer | null>(initialOfficer);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [newSector, setNewSector] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleMarkOffline = async () => {
    if (!officer) return;
    setOfficer((prev) => (prev ? { ...prev, status: "Standby" } : null));
    await markOfficerOffline(officer.id, "Shift Completed");
    setSuccessMsg(`✓ Officer ${officer.name} marked offline (Standby).`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  useEffect(() => {
    setOfficer(initialOfficer);
    if (initialOfficer) {
      setNewSector(initialOfficer.sector);
      setNewStatus(initialOfficer.status);
    }
  }, [initialOfficer]);

  // Listen for Escape key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !officer) return null;

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officer) return;

    const updatedHistory = [
      {
        id: `HIS-${Math.floor(100 + Math.random() * 900)}`,
        taskName: `Reassigned to ${newSector}`,
        sector: newSector,
        status: "In Progress",
        timestamp: "Just now",
      },
      ...(officer.assignmentHistory || []),
    ];

    const updatedOfficer = {
      ...officer,
      sector: newSector,
      status: newStatus as any,
      assignmentHistory: updatedHistory,
    };

    setOfficer(updatedOfficer);

    // Call backend API if available
    fetch(`http://localhost:8000/api/v1/officers/${officer.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: newSector, status: newStatus }),
    }).catch(() => {});

    setSuccessMsg(`✓ Officer ${officer.name} successfully reassigned to ${newSector}!`);
    setIsReassignModalOpen(false);

    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "On Field":
      case "Operational":
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-[#2E7D32] border border-emerald-300 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
            {status}
          </span>
        );
      case "Dispatched":
      case "In Use":
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-[#1565C0] border border-blue-300 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0] animate-pulse"></span>
            {status}
          </span>
        );
      case "Standby":
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-[#D97706] border border-amber-300 w-fit">
            {status}
          </span>
        );
      case "Critical":
      case "Out of Service":
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-[#B91C1C] border border-red-300 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] animate-pulse"></span>
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent backdrop - Clicking closes drawer */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container (~400px wide from right) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#D7DEE7] shadow-2xl flex flex-col justify-between text-slate-800 font-sans z-10 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 bg-[#1F3A5F] text-white flex items-center justify-between border-b-2 border-[#1565C0]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-base text-white">
                👮
              </div>
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase block leading-tight">
                  Field Responder Detail
                </span>
                <h2 className="text-base font-bold text-white leading-tight">
                  {officer.name}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors font-bold text-sm"
              title="Close Drawer (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body - Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            
            {/* Success Banner */}
            {successMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-[#2E7D32] rounded font-semibold text-xs animate-in fade-in">
                {successMsg}
              </div>
            )}

            {/* Identity & Status Card */}
            <div className="p-4 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#1F3A5F] text-sm">{officer.id}</span>
                {getStatusBadge(officer.status)}
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase block tracking-wider">
                  Unit / Role
                </label>
                <p className="font-bold text-slate-900 text-xs">{officer.role}</p>
              </div>

              <div className="space-y-1 pt-1 border-t border-[#D7DEE7]">
                <label className="text-[10px] text-slate-500 font-semibold uppercase block tracking-wider">
                  Assigned Sector
                </label>
                <p className="font-medium text-[#1F3A5F] text-xs">{officer.sector}</p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="p-4 bg-white border border-[#D7DEE7] rounded space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D7DEE7] pb-2">
                <span>📞</span> Contact & Dispatch Channel
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {officer.phone || "+91 98201 44321"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">VHF Radio Frequency:</span>
                  <span className="font-mono text-slate-700">Channel 4 (156.8 MHz)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">GPS Signal Status:</span>
                  <span className="text-emerald-700 font-medium">Active (100% Signal)</span>
                </div>
              </div>
            </div>

            {/* Recent Assignment History Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-1.5">
                <span>📜</span> Recent Assignment History
              </h3>

              <div className="space-y-2">
                {officer.assignmentHistory && officer.assignmentHistory.length > 0 ? (
                  officer.assignmentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-1 shadow-2xs hover:border-[#1565C0] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{item.taskName}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            item.status === "In Progress"
                              ? "bg-blue-100 text-[#1565C0]"
                              : "bg-emerald-100 text-[#2E7D32]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                        <span>{item.sector}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded text-slate-500 text-center italic">
                    No recent assignment logs found.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-[#F6F7F9] border-t border-[#D7DEE7] flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 border border-[#D7DEE7] bg-white hover:bg-slate-100 rounded text-slate-700 font-medium text-xs transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleMarkOffline}
              className="px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[#D97706] rounded font-semibold text-xs transition-colors cursor-pointer"
            >
              Mark Offline
            </button>
            <button
              onClick={() => setIsReassignModalOpen(true)}
              className="px-3 py-2 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Reassign Officer
            </button>
          </div>

        </div>
      </div>

      {/* Modal Dialog for Reassigning Officer */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D7DEE7] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Reassign Officer / Field Unit</h3>
              <button onClick={() => setIsReassignModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3">
              <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded">
                <p><strong>Officer:</strong> {officer.name} ({officer.id})</p>
                <p><strong>Role:</strong> {officer.role}</p>
                <p><strong>Current Sector:</strong> {officer.sector}</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Sector / Ward Assignment:</label>
                <select
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded text-slate-800"
                >
                  <option value="Ward 1 (Old Panvel)">Ward 1 (Old Panvel)</option>
                  <option value="Ward 2 (New Panvel)">Ward 2 (New Panvel)</option>
                  <option value="Ward 3 (Station Road)">Ward 3 (Station Road)</option>
                  <option value="Ward 4 (Kalamboli)">Ward 4 (Kalamboli)</option>
                  <option value="Ward 5 (Khandeshwar)">Ward 5 (Khandeshwar)</option>
                  <option value="Central DEOC Command Base">Central DEOC Command Base</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Duty Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded text-slate-800"
                >
                  <option value="On Field">On Field</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Standby">Standby</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D7DEE7]">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-3 py-1.5 border border-[#D7DEE7] rounded text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-semibold transition-colors"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
