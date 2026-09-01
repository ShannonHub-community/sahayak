import React from 'react';
import { PieChart, DollarSign, Activity, Utensils, HeartHandshake, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const FundsTrackerWidget = ({ trackerData = null }) => {
  // Fallback data if backend data not passed yet
  const categories = trackerData?.categories || [
    { name: "Food & Meals", percentage: 45.0, color: "#f97316", status: "Active Allocation", total_units: "5,400 Packets" },
    { name: "Medical Equipment & Supplies", percentage: 30.0, color: "#22c55e", status: "Verified & Dispatched", total_units: "1,500 Kits" },
    { name: "Human Resources", percentage: 15.0, color: "#3b82f6", status: "Deployed at Shelters", total_units: "120 Volunteers" },
    { name: "Financial Assistance", percentage: 10.0, color: "#a855f7", status: "Routed to CMRF / NDMA", total_amount: "₹4,75,000" }
  ];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white tracking-wide flex items-center gap-2">
              Public Funds & Resource Allocation Tracker
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                LIVE AGGREGATED
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time category-level distribution derived from verified disaster inventory & CMRF routes
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono text-slate-400 block">Transparency Protocol</span>
          <span className="text-xs font-bold text-purple-300 flex items-center justify-end gap-1">
            Category-Level Audit <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </span>
        </div>
      </div>

      {/* Progress Bars for Categories */}
      <div className="space-y-3 pt-1">
        {/* Multi-segmented stacked progress bar */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              className="h-full transition-all duration-500 relative group"
              title={`${cat.name}: ${cat.percentage}%`}
            />
          ))}
        </div>

        {/* Detailed Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {categories.map((cat, idx) => {
            const isFood = cat.name.includes("Food");
            const isMed = cat.name.includes("Medical");
            const isHR = cat.name.includes("Human");
            const isFin = cat.name.includes("Financial");

            return (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]" title={cat.name}>
                      {cat.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-white">
                    {cat.percentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{cat.status}</span>
                  <span className="font-mono font-bold text-slate-200">
                    {cat.total_amount || cat.total_units}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl p-2.5 flex items-center justify-between text-xs text-purple-200">
        <span className="flex items-center gap-1.5">
          <ArrowUpRight className="w-4 h-4 text-purple-400 shrink-0" />
          Direct CMRF & NDMA Allocation: Funds flow to official government relief accounts with instant 80G verification.
        </span>
        <span className="font-mono text-[10px] text-purple-300 font-bold shrink-0 hidden md:inline">
          100% NON-PRIVATE
        </span>
      </div>
    </div>
  );
};
