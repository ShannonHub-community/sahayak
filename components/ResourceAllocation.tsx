"use client";

export default function ResourceAllocation() {
  const resources = [
    { id: "RES-001", name: "Inflatable Rescue Boat (IRB-250)", category: "Boats", allocated: "Old Panvel (Ward 1)", total: 8, available: 6, status: "Operational" },
    { id: "RES-002", name: "High-Capacity Sludge Dewatering Pump", category: "Pumps", allocated: "Station Road (Ward 3)", total: 12, available: 4, status: "In Use" },
    { id: "RES-003", name: "Advanced Life Support Ambulance", category: "Medical", allocated: "Kalamboli (Ward 4)", total: 5, available: 3, status: "Operational" },
    { id: "RES-004", name: "62.5 kVA Diesel Generator", category: "Power", allocated: "Khandeshwar (Ward 5)", total: 10, available: 8, status: "Operational" },
  ];

  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-4 text-slate-800 font-sans shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#D7DEE7] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1F3A5F]">Resource & Logistics Allocation</h2>
          <p className="text-xs text-slate-500">Equipment Reserves, Vehicle Stock & Emergency Inventory Ledger</p>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#D7DEE7] rounded">
        <table className="w-full text-left text-xs table-admin">
          <thead className="bg-[#1F3A5F] text-white font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-3.5 py-2.5">Asset ID</th>
              <th className="px-3.5 py-2.5">Resource Name</th>
              <th className="px-3.5 py-2.5">Category</th>
              <th className="px-3.5 py-2.5">Allocated Sector</th>
              <th className="px-3.5 py-2.5">Available / Total</th>
              <th className="px-3.5 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
            {resources.map((r) => (
              <tr key={r.id}>
                <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{r.id}</td>
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{r.name}</td>
                <td className="px-3.5 py-2.5 text-slate-600">{r.category}</td>
                <td className="px-3.5 py-2.5 font-medium text-slate-700">{r.allocated}</td>
                <td className="px-3.5 py-2.5 font-mono text-[#1F3A5F]"><strong>{r.available}</strong> / {r.total}</td>
                <td className="px-3.5 py-2.5">
                  <span className="bg-emerald-100 text-[#2E7D32] border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}