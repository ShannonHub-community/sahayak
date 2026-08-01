"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " | " +
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }) +
          " IST"
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-800 font-sans flex flex-col">
      {/* Official NIC / Government Header */}
      <header className="bg-[#1F3A5F] text-white border-b-4 border-[#1565C0] shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-lg text-white">
              🏛️
            </div>
            <div>
              <span className="text-[11px] font-medium tracking-wider text-slate-300 uppercase block leading-none">
                Government of Maharashtra • District Disaster Management Authority
              </span>
              <h1 className="font-bold text-lg tracking-tight text-white mt-1 leading-tight">
                District Emergency Operations Centre (DEOC)
              </h1>
              <p className="text-xs text-slate-300">Panvel Sub-Division, District Raigad</p>
            </div>
          </div>

          {/* Right Header Metadata Panel */}
          <div className="flex items-center gap-4 text-xs border-t md:border-t-0 md:border-l border-white/20 pt-2 md:pt-0 md:pl-4">
            <div>
              <span className="text-slate-300 text-[10px] uppercase block font-semibold">Duty Officer</span>
              <span className="font-medium text-white">RDC / EOC In-Charge</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-slate-300 text-[10px] uppercase block font-semibold">System Time</span>
              <span className="font-mono text-white font-medium">{currentTime || "Loading..."}</span>
            </div>
            <div>
              <span className="text-slate-300 text-[10px] uppercase block font-semibold">Status</span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-800 text-emerald-100 border border-emerald-600">
                MONSOON WATCH (LEVEL-2)
              </span>
            </div>
          </div>
        </div>

        {/* Administrative Navigation Strip */}
        <div className="bg-[#182C48] border-t border-white/10 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 text-xs">
            {[
              { id: "overview", label: "Control Room Dashboard" },
              { id: "workforce", label: "Workforce & Personnel Roster" },
              { id: "resources", label: "Resource & Equipment Ledger" },
              { id: "hydrology", label: "Weather & Flood Summary" },
              { id: "comms", label: "Communication Status" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-white bg-[#1F3A5F] text-white"
                    : "border-transparent text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Operational Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        
        {/* Government Dashboard Metric Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Active Incidents", val: "6", status: "Critical", color: "text-[#B91C1C]", bg: "bg-red-50" },
            { label: "Personnel Deployed", val: "18", status: "On Field", color: "text-[#1F3A5F]", bg: "bg-slate-50" },
            { label: "Relief Camps", val: "4 Open", status: "1,200 Capacity", color: "text-[#2E7D32]", bg: "bg-emerald-50" },
            { label: "Flood Risk Index", val: "Level 3", status: "High Risk", color: "text-[#D97706]", bg: "bg-amber-50" },
            { label: "Medical Teams", val: "5 Active", status: "Standby", color: "text-[#1565C0]", bg: "bg-blue-50" },
            { label: "Road Closures", val: "2 Sector", status: "Panvel-Old", color: "text-[#B91C1C]", bg: "bg-red-50" },
            { label: "Weather Alert", val: "Heavy Rain", status: "IMD Red Alert", color: "text-[#D97706]", bg: "bg-amber-50" },
            { label: "Comms Network", val: "99.4%", status: "VHF Active", color: "text-[#2E7D32]", bg: "bg-emerald-50" },
          ].map((m, idx) => (
            <div key={idx} className={`p-3 bg-white border border-[#D7DEE7] rounded text-left shadow-2xs`}>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight block">{m.label}</span>
              <span className={`text-lg font-semibold ${m.color} block mt-0.5 font-mono`}>{m.val}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{m.status}</span>
            </div>
          ))}
        </div>

        {activeTab === "overview" ? (
          /* Main EOC Operations Dashboard */
          <div className="space-y-5">
            
            {/* GIS Centerpiece & Live Feed Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* GIS GIS Layer View (2/3 width) */}
              <div className="lg:col-span-2 space-y-2">
                <div className="bg-white border border-[#D7DEE7] px-4 py-2.5 rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F3A5F]">GIS Spatial Layer:</span>
                    <span className="text-slate-600">Panvel Disaster Zone Boundary & Asset Overlay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Layers:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-medium text-[11px]">
                      Flood Zones • Shelters • Medical • Blocked Roads
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#D7DEE7] rounded p-1">
                  <MapView />
                </div>
              </div>

              {/* Right Panel: Live Incident Feed */}
              <div className="bg-white border border-[#D7DEE7] rounded p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#D7DEE7]">
                    <h3 className="font-semibold text-sm text-[#1F3A5F]">Live Incident Feed</h3>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                      6 Total Records
                    </span>
                  </div>

                  {/* Incident Feed List Table */}
                  <div className="mt-3 space-y-2 max-h-135 overflow-y-auto text-xs pr-1">
                    {[
                      { id: "INC-102", cat: "Evacuation", ward: "Ward 1 (Old Panvel)", prio: "Critical", team: "NDRF Unit 1", time: "18:42" },
                      { id: "INC-101", cat: "Waterlogging", ward: "Ward 3 (Station Rd)", prio: "High", team: "Municipal Crew", time: "18:35" },
                      { id: "INC-104", cat: "Medical Emergency", ward: "Ward 4 (Kalamboli)", prio: "High", team: "EMS Ambulance 3", time: "18:28" },
                      { id: "INC-103", cat: "Road Blocked", ward: "Ward 5 (Khandeshwar)", prio: "Medium", team: "Public Works Dept", time: "18:15" },
                      { id: "INC-105", cat: "Tree Fallen", ward: "Ward 2 (New Panvel)", prio: "Low", team: "Fire Services", time: "17:50" },
                      { id: "INC-106", cat: "Shelter Request", ward: "Ward 6 (Kamothe)", prio: "Medium", team: "Revenue Dept", time: "17:40" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-[#FAFCFE] border border-[#D7DEE7] rounded hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-semibold text-[#1F3A5F]">{item.id}</span>
                          <span className="text-slate-500 font-mono">{item.time} IST</span>
                        </div>
                        <div className="font-semibold text-slate-900 mt-1 text-xs">{item.cat} — <span className="font-normal text-slate-700">{item.ward}</span></div>
                        <div className="flex items-center justify-between mt-2 text-[11px] pt-1.5 border-t border-slate-200">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            item.prio === "Critical"
                              ? "bg-red-100 text-[#B91C1C] border border-red-300"
                              : item.prio === "High"
                              ? "bg-amber-100 text-[#D97706] border border-amber-300"
                              : "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}>
                            {item.prio}
                          </span>
                          <span className="text-slate-600 font-medium">Assigned: {item.team}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D7DEE7] text-[11px] text-slate-500 flex justify-between">
                  <span>DEOC Incident Control</span>
                  <span>NIC Standard v2.4</span>
                </div>
              </div>

            </div>

            {/* Additional EOC Modules (Weather Summary, Comms, Resources) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Weather & Hydrology Summary */}
              <div className="bg-white border border-[#D7DEE7] p-4 rounded space-y-2">
                <h4 className="font-semibold text-[#1F3A5F] border-b border-[#D7DEE7] pb-1.5">Weather & Hydrology Summary</h4>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between"><span>IMD Weather Forecast:</span> <strong className="text-[#D97706]">Heavy Rainfall Alert</strong></div>
                  <div className="flex justify-between"><span>Panvel 24h Rainfall:</span> <strong className="font-mono">114.2 mm</strong></div>
                  <div className="flex justify-between"><span>Gadheshwar Dam Level:</span> <strong className="font-mono text-[#B91C1C]">92.4% (Critical)</strong></div>
                  <div className="flex justify-between"><span>High Tide Warning:</span> <strong className="font-mono">4.1m @ 22:15 IST</strong></div>
                </div>
              </div>

              {/* Resource & Vehicle Availability */}
              <div className="bg-white border border-[#D7DEE7] p-4 rounded space-y-2">
                <h4 className="font-semibold text-[#1F3A5F] border-b border-[#D7DEE7] pb-1.5">Resource & Vehicle Deployment</h4>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between"><span>NDRF Rescue Boats:</span> <strong className="text-[#2E7D32]">6 Deployed (2 Reserve)</strong></div>
                  <div className="flex justify-between"><span>Dewatering Heavy Pumps:</span> <strong className="font-mono">12 Operational</strong></div>
                  <div className="flex justify-between"><span>108 Ambulance Units:</span> <strong className="font-mono text-[#2E7D32]">8 On Duty</strong></div>
                  <div className="flex justify-between"><span>Emergency Generators:</span> <strong className="font-mono">15 Units Deployed</strong></div>
                </div>
              </div>

              {/* Communication System Status */}
              <div className="bg-white border border-[#D7DEE7] p-4 rounded space-y-2">
                <h4 className="font-semibold text-[#1F3A5F] border-b border-[#D7DEE7] pb-1.5">Communication Network Status</h4>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between"><span>District VHF Repeater:</span> <strong className="text-[#2E7D32]">100% Operational</strong></div>
                  <div className="flex justify-between"><span>Satellite Phones (ISAT):</span> <strong className="font-mono">4 Active Units</strong></div>
                  <div className="flex justify-between"><span>SEOC Hotline Link:</span> <strong className="text-[#2E7D32]">Connected</strong></div>
                  <div className="flex justify-between"><span>Public Warning Siren:</span> <strong className="font-mono">Sector 1-4 Ready</strong></div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Government Administrative Workforce Roster */
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

            {/* Official Government Table */}
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
        )}

      </main>

      {/* Official Government Footer */}
      <footer className="bg-[#182C48] text-slate-300 text-xs border-t border-[#D7DEE7] py-3 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© Government of Maharashtra • District Disaster Management Authority (DDMA), Raigad</p>
          <p className="text-slate-400 font-mono text-[11px]">National Informatics Centre (NIC) Standards • DEOC Portal v4.2</p>
        </div>
      </footer>
    </div>
  );
}