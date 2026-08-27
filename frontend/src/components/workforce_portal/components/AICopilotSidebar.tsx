// @ts-nocheck
"use client";

import { useState } from "react";

export default function AICopilotSidebar() {
  const [status, setStatus] = useState<"IDLE" | "APPROVED" | "REJECTED">("IDLE");

  const handleApprove = () => {
    setStatus("APPROVED");
    alert("AI Recommendation APPROVED: Resource lock request sent to Workforce Dispatch.");
  };

  const handleReject = () => {
    setStatus("REJECTED");
    alert("AI Recommendation REJECTED: Incident returned to manual dispatch queue.");
  };

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-4 flex flex-col justify-between space-y-4 text-slate-800 font-sans shadow-2xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#D7DEE7]">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <h3 className="font-semibold text-sm text-[#1F3A5F]">AI Decision Copilot</h3>
          </div>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
            MODEL ACTIVE
          </span>
        </div>

        {/* Current Incident Focus */}
        <div className="mt-3 bg-[#FAFCFE] border border-[#D7DEE7] p-3 rounded space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-bold text-[#1F3A5F]">TARGET: INC-102</span>
            <span className="text-[#B91C1C] font-semibold bg-red-100 px-1.5 py-0.5 rounded">Critical</span>
          </div>
          <h4 className="font-bold text-xs text-slate-900">Evacuation at Ward 1 (Old Panvel)</h4>
          <p className="text-xs text-slate-600 leading-normal">
            Rising river levels threating 15 residential units in low-lying sector.
          </p>
        </div>

        {/* AI Recommendation Output Card */}
        <div className="mt-3 bg-blue-50/60 border border-blue-200 p-3 rounded space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1565C0] uppercase tracking-wider text-[10px]">Optimized Action Plan</span>
            <span className="text-[10px] text-slate-500 font-mono">Conf: 94.2%</span>
          </div>

          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            Deploy <strong>2 Inflatable Rescue Boats (IRB-250)</strong> from Ward 3 & <strong>1 EMS Ambulance</strong> from Kalamboli.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 border-t border-blue-200/60">
            <div>Est. Arrival: <strong>8 mins</strong></div>
            <div>Risk Reduction: <strong>-78%</strong></div>
          </div>
        </div>

        {/* Action Status Banner */}
        {status !== "IDLE" && (
          <div className={`mt-3 p-2 rounded text-center text-xs font-semibold ${
            status === "APPROVED" ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300" : "bg-red-100 text-[#B91C1C] border border-red-300"
          }`}>
            {status === "APPROVED" ? "✓ Recommendation Approved & Dispatched" : "✕ Recommendation Rejected"}
          </div>
        )}
      </div>

      {/* Interactive Action Buttons */}
      <div className="space-y-2 pt-3 border-t border-[#D7DEE7]">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleApprove}
            disabled={status === "APPROVED"}
            className="w-full bg-[#1F3A5F] hover:bg-[#1565C0] disabled:bg-slate-300 text-white font-medium text-xs py-2 rounded transition-colors"
          >
            Approve Action
          </button>
          <button
            onClick={handleReject}
            disabled={status === "REJECTED"}
            className="w-full bg-white border border-[#D7DEE7] hover:bg-slate-100 text-slate-700 font-medium text-xs py-2 rounded transition-colors"
          >
            Reject / Manual
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          DEOC Automated Decision Core • Panvel Sector
        </p>
      </div>
    </div>
  );
}