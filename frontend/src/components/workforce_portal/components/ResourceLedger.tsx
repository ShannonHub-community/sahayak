// @ts-nocheck
"use client";

import React, { useState } from "react";

export default function ResourceLedger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [resources, setResources] = useState([
    { id: "RES-001", name: "Inflatable Rescue Boat (IRB-250)", category: "Boats", allocatedWard: "Ward 1 (Old Panvel)", total: 8, available: 6, unit: "Boats", status: "Operational", lastInspected: "Today, 08:00 IST" },
    { id: "RES-002", name: "100 HP Sludge Dewatering Pump", category: "Pumps", allocatedWard: "Ward 3 (Station Road)", total: 12, available: 4, unit: "Pumps", status: "In Use", lastInspected: "Today, 10:30 IST" },
    { id: "RES-003", name: "Advanced Life Support Ambulance", category: "Ambulances", allocatedWard: "Ward 4 (Kalamboli)", total: 5, available: 3, unit: "Vehicles", status: "Operational", lastInspected: "Today, 07:15 IST" },
    { id: "RES-004", name: "62.5 kVA Diesel Mobile Generator", category: "Generators", allocatedWard: "Ward 5 (Khandeshwar)", total: 10, available: 8, unit: "Units", status: "Operational", lastInspected: "Yesterday, 18:00 IST" },
    { id: "RES-005", name: "High-Capacity Submersible Water Pump", category: "Pumps", allocatedWard: "Ward 2 (New Panvel)", total: 6, available: 1, unit: "Pumps", status: "Critical Stock", lastInspected: "Today, 11:00 IST" },
    { id: "RES-006", name: "Emergency Food & Water Ration Kits", category: "Relief Supplies", allocatedWard: "Panvel Central Warehouse", total: 1500, available: 1200, unit: "Kits", status: "Operational", lastInspected: "Today, 06:00 IST" },
  ]);

  // Form State for Intake
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Pumps",
    allocatedWard: "Ward 1 (Old Panvel)",
    total: 10,
    available: 10,
    unit: "Units",
    status: "Operational",
  });

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const created: any = {
      id: `RES-00${resources.length + 1}`,
      name: newItem.name,
      category: newItem.category,
      allocatedWard: newItem.allocatedWard,
      total: Number(newItem.total),
      available: Number(newItem.available),
      unit: newItem.unit,
      status: newItem.status,
      lastInspected: "Just now",
    };

    // Try posting to backend API as well
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
    fetch(`${apiBase}/api/v1/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    }).catch(() => {});

    setResources([created, ...resources]);
    setIsModalOpen(false);
    setNewItem({
      name: "",
      category: "Pumps",
      allocatedWard: "Ward 1 (Old Panvel)",
      total: 10,
      available: 10,
      unit: "Units",
      status: "Operational",
    });
  };

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
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span>+</span> Intake New Inventory
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Inventory</span>
          <h3 className="text-lg font-bold text-[#1F3A5F] font-mono mt-0.5">{resources.length + 1535} Items</h3>
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

      {/* Modal Dialog for Intake New Inventory */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D7DEE7] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F3A5F]">Intake New Inventory / Asset</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Equipment Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 HP High Flow Dewatering Pump"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded"
                  >
                    <option value="Boats">Rescue Boats</option>
                    <option value="Pumps">Dewatering Pumps</option>
                    <option value="Ambulances">Ambulances</option>
                    <option value="Generators">Generators</option>
                    <option value="Relief Supplies">Relief Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Allocated Sector:</label>
                  <select
                    value={newItem.allocatedWard}
                    onChange={(e) => setNewItem({ ...newItem, allocatedWard: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded"
                  >
                    <option value="Ward 1 (Old Panvel)">Ward 1 (Old Panvel)</option>
                    <option value="Ward 2 (New Panvel)">Ward 2 (New Panvel)</option>
                    <option value="Ward 3 (Station Road)">Ward 3 (Station Road)</option>
                    <option value="Ward 4 (Kalamboli)">Ward 4 (Kalamboli)</option>
                    <option value="Ward 5 (Khandeshwar)">Ward 5 (Khandeshwar)</option>
                    <option value="Panvel Central Warehouse">Panvel Central Warehouse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.total}
                    onChange={(e) => setNewItem({ ...newItem, total: Number(e.target.value) })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Available:</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.available}
                    onChange={(e) => setNewItem({ ...newItem, available: Number(e.target.value) })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit:</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Operational Status:</label>
                <select
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded"
                >
                  <option value="Operational">Operational</option>
                  <option value="In Use">In Use</option>
                  <option value="Critical Stock">Critical Stock</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D7DEE7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-[#D7DEE7] rounded text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-semibold transition-colors"
                >
                  + Add to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}