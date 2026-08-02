"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import WorkforceTab from "../components/WorkforceTab";

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
      {/* Header */}
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

        {/* Navigation Tabs */}
        <div className="bg-[#182C48] border-t border-white/10 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 text-xs">
            {[
              { id: "overview", label: "Control Room Dashboard" },
              { id: "workforce", label: "Workforce Console & Dispatch" },
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
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Active Incidents", val: "6", status: "Critical", color: "text-[#B91C1C]" },
            { label: "Personnel Deployed", val: "18", status: "On Field", color: "text-[#1F3A5F]" },
            { label: "Relief Camps", val: "4 Open", status: "1,200 Capacity", color: "text-[#2E7D32]" },
            { label: "Flood Risk Index", val: "Level 3", status: "High Risk", color: "text-[#D97706]" },
            { label: "Medical Teams", val: "5 Active", status: "Standby", color: "text-[#1565C0]" },
            { label: "Road Closures", val: "2 Sector", status: "Panvel-Old", color: "text-[#B91C1C]" },
            { label: "Weather Alert", val: "Heavy Rain", status: "IMD Red Alert", color: "text-[#D97706]" },
            { label: "Comms Network", val: "99.4%", status: "VHF Active", color: "text-[#2E7D32]" },
          ].map((m, idx) => (
            <div key={idx} className="p-3 bg-white border border-[#D7DEE7] rounded text-left shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight block">{m.label}</span>
              <span className={`text-lg font-semibold ${m.color} block mt-0.5 font-mono`}>{m.val}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{m.status}</span>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-2">
              <div className="bg-white border border-[#D7DEE7] px-4 py-2.5 rounded flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1F3A5F]">Panvel GIS Spatial Incident Mapping</span>
                <span className="text-slate-500 text-[11px]">Realtime REST Polling Active</span>
              </div>
              <div className="bg-white border border-[#D7DEE7] rounded p-1">
                <MapView />
              </div>
            </div>

            <div className="bg-white border border-[#D7DEE7] rounded p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#D7DEE7]">
                  <h3 className="font-semibold text-sm text-[#1F3A5F]">Live Incident Feed</h3>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    6 Total Records
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-135 overflow-y-auto text-xs pr-1">
                  {[
                    { id: "INC-102", cat: "Evacuation", ward: "Ward 1 (Old Panvel)", prio: "Critical", team: "NDRF Unit 1", time: "18:42" },
                    { id: "INC-101", cat: "Waterlogging", ward: "Ward 3 (Station Rd)", prio: "High", team: "Municipal Crew", time: "18:35" },
                    { id: "INC-104", cat: "Medical Emergency", ward: "Ward 4 (Kalamboli)", prio: "High", team: "EMS Ambulance 3", time: "18:28" },
                    { id: "INC-103", cat: "Road Blocked", ward: "Ward 5 (Khandeshwar)", prio: "Medium", team: "Public Works Dept", time: "18:15" },
                  ].map((item) => (
                    <div key={item.id} className="p-2.5 bg-[#FAFCFE] border border-[#D7DEE7] rounded hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-[#1F3A5F]">{item.id}</span>
                        <span className="text-slate-500 font-mono">{item.time} IST</span>
                      </div>
                      <div className="font-semibold text-slate-900 mt-1 text-xs">{item.cat} — <span className="font-normal text-slate-700">{item.ward}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#D7DEE7] text-[11px] text-slate-500 flex justify-between">
                <span>DEOC Control Room</span>
                <span>v4.2-EOC</span>
              </div>
            </div>
          </div>
        ) : (
          <WorkforceTab />
        )}

      </main>

      <footer className="bg-[#182C48] text-slate-300 text-xs border-t border-[#D7DEE7] py-3 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p>© Government of Maharashtra • District Disaster Management Authority (DDMA)</p>
          <p className="text-slate-400 font-mono text-[11px]">DEOC Portal v4.2</p>
        </div>
      </footer>
    </div>
  );
}