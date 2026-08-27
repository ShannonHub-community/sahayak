// @ts-nocheck
"use client";

export default function Analytics() {
  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-4 text-slate-800 font-sans shadow-2xs">
      <div className="border-b border-[#D7DEE7] pb-3">
        <h2 className="text-base font-bold text-[#1F3A5F]">Operational Disaster Analytics & EOC Metrics</h2>
        <p className="text-xs text-slate-500">Response Speed Benchmarks, Sector Incident Trends & AI Forecasts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-4 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-1">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Average Response Time</span>
          <h3 className="text-2xl font-bold text-[#1F3A5F] font-mono">11.4 Mins</h3>
          <p className="text-emerald-700 font-medium text-[11px]">↓ 2.3 mins faster than benchmark</p>
        </div>

        <div className="p-4 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-1">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">Mission Success Rate</span>
          <h3 className="text-2xl font-bold text-[#2E7D32] font-mono">96.8%</h3>
          <p className="text-slate-500 text-[11px]">42 of 44 Operations Successful</p>
        </div>

        <div className="p-4 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-1">
          <span className="text-slate-500 font-semibold uppercase text-[10px]">AI Prediction Confidence</span>
          <h3 className="text-2xl font-bold text-[#1565C0] font-mono">94.2%</h3>
          <p className="text-slate-500 text-[11px]">XGBoost Inundation Model Active</p>
        </div>
      </div>
    </div>
  );
}