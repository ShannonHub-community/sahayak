// @ts-nocheck
"use client";

import React from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "map", label: "Tactical Map", icon: "🗺️" },
    { id: "missions", label: "Mission Control", icon: "🎯" },
    { id: "workforce", label: "Workforce Roster", icon: "👮" },
    { id: "resources", label: "Resource Allocation", icon: "📦" },
    { id: "copilot", label: "AI Copilot", icon: "🤖" },
    { id: "analytics", label: "EOC Analytics", icon: "📈" },
    { id: "audit", label: "Audit Logs", icon: "📜" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-[#182C48] text-slate-300 border-r border-[#D7DEE7] flex flex-col justify-between p-4 shadow-md font-sans">
      <div className="space-y-4">
        {/* Sidebar Brand Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10 px-2">
          <span className="text-2xl">🏛️</span>
          <div>
            <h2 className="font-bold text-sm text-white tracking-wide">DEOC COMMAND</h2>
            <p className="text-[10px] text-slate-400">Panvel Disaster Authority</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                activeTab === item.id
                  ? "bg-[#1F3A5F] text-white border-l-4 border-white shadow-2xs"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-1 px-2">
        <div className="flex justify-between">
          <span>System Status:</span>
          <strong className="text-emerald-400 font-medium">OPERATIONAL</strong>
        </div>
        <div className="flex justify-between">
          <span>EOC Version:</span>
          <strong className="text-slate-300 font-mono">v4.2-SIH</strong>
        </div>
      </div>
    </aside>
  );
}