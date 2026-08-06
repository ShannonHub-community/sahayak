// @ts-nocheck
"use client";

import React, { useState } from "react";

export default function ResourceLedger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const resources = [
    { id: "RES-001", name: "Inflatable Rescue Boat (IRB-250)", category: "Boats", allocatedWard: "Ward 1 (Old Panvel)", total: 8, available: 6, unit: "Boats", status: "Operational", lastInspected: "Today, 08:00 IST" },
    { id: "RES-002", name: "100 HP Sludge Dewatering Pump", category: "Pumps", allocatedWard: "Ward 3 (Station Road)", total: 12, available: 4, unit: "Pumps", status: "In Use", lastInspected: "Today, 10:30 IST" },
    { id: "RES-003", name: "Advanced Life Support Ambulance", category: "Ambulances", allocatedWard: "Ward 4 (Kalamboli)", total: 5, available: 3, unit: "Vehicles", status: "Operational", lastInspected: "Today, 07:15 IST" },
    { id: "RES-004", name: "62.5 kVA Diesel Mobile Generator", category: "Generators", allocatedWard: "Ward 5 (Khandeshwar)", total: 10, available: 8, unit: "Units", status: "Operational", lastInspected: "Yesterday, 18:00 IST" },
    { id: "RES-005", name: "High-Capacity Submersible Water Pump", category: "Pumps", allocatedWard: "Ward 2 (New Panvel)", total: 6, available: 1, unit: "Pumps", status: "Critical Stock", lastInspected: "Today, 11:00 IST" },
    { id: "RES-006", name: "Emergency Food & Water Ration Kits", category: "Relief Supplies", allocatedWard: "Panvel Central Warehouse", total: 1500, available: 1200, unit: "Kits", status: "Operational", lastInspected: "Today, 06:00 IST" },
  ];

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.allocatedWard.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-5 text-slate-800 font-sans shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D7DEE7] pb-3.5 gap-2">
        <div>
          <h2 className="text-base font-bold text-[#1F3A5F]">Resource & Equipment Ledger</h2>
          <p className="text-xs text-slate-500">Inventory Tracking, Equipment Allocation & Depot Stock Levels</p>
        </div>
        <button className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors">
          + Intake New Inventory
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Inventory</span>
          <h3 className="text-lg font-bold text-[#1F3A5F] font-mono mt-0.5">1,541 Items</h3>
          <span className="text-[10px] text-slate-500">Across 6 Sectors</span>
        </div>
        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Available Deployment</span>
          <h3 className="text-lg font-bold text-[#2E7D32] font-mono mt-0.5">1,222 Ready</h3>
          <span className="text-[10px] text-[#2E7D32]">79.2% Operational</span>
        </div>
        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Active In Use</span>
          <h3 className="text-lg font-bold text-[#1565C0] font-mono mt-0.5">314 Deployed</h3>
          <span className="text-[10px] text-slate-500">Field Duty</span>
        </div>
        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Stock Alert</span>
          <h3 className="text-lg font-bold text-[#B91C1C] font-mono mt-0.5">1 Critical</h3>
          <span className="text-[10px] text-[#B91C1C]">Submersible Pumps</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <input
          type="text"
          placeholder="Search asset, ID, or ward..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-slate-500 font-medium">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="Boats">Rescue Boats</option>
            <option value="Pumps">Dewatering Pumps</option>
            <option value="Ambulances">Ambulances</option>
            <option value="Generators">Generators</option>
            <option value="Relief Supplies">Relief Supplies</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#D7DEE7] rounded">
        <table className="w-full text-left text-xs table-admin">
          <thead className="bg-[#1F3A5F] text-white font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-3.5 py-2.5">Asset ID</th>
              <th className="px-3.5 py-2.5">Equipment Name</th>
              <th className="px-3.5 py-2.5">Category</th>
              <th className="px-3.5 py-2.5">Allocated Sector</th>
              <th className="px-3.5 py-2.5">Available / Total</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Last Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
            {filteredResources.map((item) => (
              <tr key={item.id}>
                <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{item.id}</td>
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.name}</td>
                <td className="px-3.5 py-2.5 text-slate-600">{item.category}</td>
                <td className="px-3.5 py-2.5 font-medium text-slate-700">{item.allocatedWard}</td>
                <td className="px-3.5 py-2.5 font-mono text-[#1F3A5F]">
                  <strong className={item.available < 2 ? "text-[#B91C1C]" : ""}>{item.available}</strong> / {item.total} {item.unit}
                </td>
                <td className="px-3.5 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    item.status === "Operational"
                      ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300"
                      : item.status === "In Use"
                      ? "bg-blue-100 text-[#1565C0] border border-blue-300"
                      : "bg-red-100 text-[#B91C1C] border border-red-300"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">{item.lastInspected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}