export default function WorkforceTab() {
  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D7DEE7] pb-3 gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#1F3A5F]">Personnel Deployment & Duty Roster</h2>
          <p className="text-xs text-slate-500">District Emergency Personnel, Officers & Field Teams Assignment</p>
        </div>
        <button className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white font-medium text-xs px-3 py-2 rounded transition-colors shadow-2xs">
          + Deploy Personnel
        </button>
      </div>

      <div className="overflow-x-auto border border-[#D7DEE7] rounded">
        <table className="w-full text-left text-xs table-admin">
          <thead className="bg-[#1F3A5F] text-white font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-3.5 py-2.5">Personnel ID</th>
              <th className="px-3.5 py-2.5">Officer Name</th>
              <th className="px-3.5 py-2.5">Department</th>
              <th className="px-3.5 py-2.5">Assignment</th>
              <th className="px-3.5 py-2.5">Current Location</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Shift</th>
              <th className="px-3.5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
            {[
              { id: "MH-DDMA-01", name: "Inspector R. Sharma", dept: "NDRF 5th Battalion", assign: "Rescue Lead", loc: "Old Panvel (Ward 1)", status: "On Duty", shift: "08:00 - 20:00" },
              { id: "MH-DDMA-02", name: "Dr. A. Verma", dept: "District Health Office", assign: "Medical Response", loc: "Kalamboli (Ward 4)", status: "On Duty", shift: "08:00 - 20:00" },
              { id: "MH-DDMA-03", name: "S. Kadam", dept: "Revenue Department", assign: "Relief Camp Overseer", loc: "Khandeshwar (Ward 5)", status: "Standby", shift: "20:00 - 08:00" },
              { id: "MH-DDMA-04", name: "V. Patil", dept: "Municipal Corporation", assign: "Water Pumping Lead", loc: "Station Road (Ward 3)", status: "On Duty", shift: "08:00 - 20:00" },
              { id: "MH-DDMA-05", name: "P. Deshmukh", dept: "Police Department", assign: "Traffic Control", loc: "NH48 Junction", status: "On Duty", shift: "14:00 - 22:00" },
            ].map((emp) => (
              <tr key={emp.id}>
                <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{emp.id}</td>
                <td className="px-3.5 py-2.5 font-medium text-slate-900">{emp.name}</td>
                <td className="px-3.5 py-2.5 text-slate-600">{emp.dept}</td>
                <td className="px-3.5 py-2.5 text-slate-700 font-medium">{emp.assign}</td>
                <td className="px-3.5 py-2.5 text-slate-600">{emp.loc}</td>
                <td className="px-3.5 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    emp.status === "On Duty"
                      ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 font-mono text-slate-600 text-[11px]">{emp.shift}</td>
                <td className="px-3.5 py-2.5">
                  <button className="text-[#1565C0] hover:underline font-semibold text-[11px]">Update Assignment</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}