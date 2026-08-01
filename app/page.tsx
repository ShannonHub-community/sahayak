"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function Home() {
  const [filter, setFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<string>("overview");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Official Government Command Center Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 border border-blue-700 p-2 rounded-md">
              <span className="text-lg">🏛️</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-lg tracking-tight text-white">
                  EMERGENCY COMMAND PORTAL
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  SYSTEM OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                District Emergency Operations Center (DEOC) • Panvel Sector Control
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              Operations Center
            </button>
            <button
              onClick={() => setActiveTab("workforce")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "workforce"
                  ? "bg-blue-900 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              Workforce & Resources
            </button>
          </div>
        </div>
      </header>

      {/* Main Administrative Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Official EOC KPI Metric Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Incidents</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">6 Reported</h2>
              <p className="text-xs text-red-700 font-medium mt-0.5">2 Pending Immediate Response</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center justify-center font-bold text-sm">
              🚨
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">District Flood Risk</p>
              <h2 className="text-2xl font-bold text-amber-700 mt-1">LEVEL 3 (HIGH)</h2>
              <p className="text-xs text-slate-600 mt-0.5">Ward 4 & Kalamboli Subsector</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-sm">
              ⚠️
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personnel Deployed</p>
              <h2 className="text-2xl font-bold text-blue-900 mt-1">18 Officers</h2>
              <p className="text-xs text-slate-600 mt-0.5">3 NDRF Units & Local Teams</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center text-sm">
              👮
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Relief Facilities</p>
              <h2 className="text-2xl font-bold text-emerald-800 mt-1">4 Active</h2>
              <p className="text-xs text-slate-600 mt-0.5">Total Capacity: 1,200 Persons</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center text-sm">
              🏥
            </div>
          </div>

        </div>

        {activeTab === "overview" ? (
          /* Dashboard Main Content Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Map Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🗺️</span>
                  <h3 className="text-sm font-bold text-slate-900">District Incident Mapping & GIS Layer</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {["ALL", "CRITICAL", "WATERLOGGING"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                        filter === f
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Canvas */}
              <div className="bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
                <MapView />
              </div>
            </div>

            {/* Operations Queue Sidebar (1/3 width) */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    Active Emergency Log
                  </h3>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    6 Entries
                  </span>
                </div>

                {/* Log Table / List */}
                <div className="mt-3 space-y-2.5 max-h-120 overflow-y-auto pr-1">
                  {[
                    { id: "INC-02", title: "Stranded Citizens near Old Panvel", severity: "Critical", ward: "Ward 1", time: "02 mins ago" },
                    { id: "INC-01", title: "Waterlogging at Station Road", severity: "High", ward: "Ward 3", time: "05 mins ago" },
                    { id: "INC-04", title: "Medical Emergency - Kalamboli", severity: "High", ward: "Ward 4", time: "12 mins ago" },
                    { id: "INC-03", title: "Submerged Road near Khandeshwar", severity: "Medium", ward: "Ward 5", time: "18 mins ago" },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">{item.id}</span>
                        <span className="text-slate-500">{item.time}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 mt-1">{item.title}</h4>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs">
                        <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                          item.severity === "Critical"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {item.severity}
                        </span>
                        <span className="text-slate-600 font-medium">{item.ward}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                <span>District Operations Center</span>
                <span className="font-mono">v4.2-EOC</span>
              </div>
            </div>

          </div>
        ) : (
          /* Workforce Management Module Tab (No Broadcast Option) */
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Workforce & Resource Deployment</h2>
                <p className="text-xs text-slate-500">Personnel Roster, Shift Management & Sector Resource Allocation</p>
              </div>
              <button className="bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs px-3.5 py-2 rounded border border-blue-950 transition-colors">
                + Assign New Personnel
              </button>
            </div>

            {/* Roster & Personnel Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Personnel ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role / Unit</th>
                    <th className="px-4 py-3">Assigned Sector</th>
                    <th className="px-4 py-3">Shift Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {[
                    { id: "EMP-101", name: "R. Sharma", role: "NDRF Team Lead", sector: "Panvel Ward 1", status: "On Duty" },
                    { id: "EMP-102", name: "A. Verma", role: "Medical Response Officer", sector: "Kalamboli Ward 4", status: "On Duty" },
                    { id: "EMP-103", name: "S. Kadam", role: "Civil Defense Coordinator", sector: "Khandeshwar Ward 5", status: "Standby" },
                    { id: "EMP-104", name: "V. Patil", role: "Logistics Specialist", sector: "Old Panvel Ward 3", status: "On Duty" },
                  ].map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold">{emp.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.role}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.sector}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          emp.status === "On Duty"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-900 hover:underline font-semibold">Manage Duty</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Official Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-3.5 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© District Disaster Management Authority • Emergency Control Room</p>
          <p className="text-slate-500">Official Operational Portal</p>
        </div>
      </footer>
    </div>
  );
}