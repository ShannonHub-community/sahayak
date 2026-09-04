// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  PhoneCall, 
  UserCheck, 
  AlertOctagon, 
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import WorkforceManagement from './WorkforceManagement';
import WorkforceConsole from './WorkforceTab';
import OfficerDrawer from './OfficerDrawer';
import { mockOfficers, Officer } from '../lib/mockData';

export default function WorkforceDashboard() {
  const [activeTab, setActiveTab] = useState<'roster' | 'dispatch'>('roster');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleSelectOfficer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const metricCards = [
    { label: 'Active Incidents', val: '6', status: 'Critical Level', color: 'text-[#B91C1C]' },
    { label: 'Personnel Deployed', val: '18', status: 'On Field Units', color: 'text-[#1F3A5F]' },
    { label: 'Relief Camps', val: '4 Open', status: '1,200 Capacity', color: 'text-[#2E7D32]' },
    { label: 'Flood Risk Index', val: 'Level 3', status: 'High Risk Alert', color: 'text-[#D97706]' },
    { label: 'Medical Teams', val: '5 Active', status: 'Standby & Transit', color: 'text-[#1565C0]' },
    { label: 'Road Closures', val: '2 Sectors', status: 'Panvel-Old Highway', color: 'text-[#B91C1C]' },
    { label: 'Weather Alert', val: 'Heavy Rain', status: 'IMD Red Alert', color: 'text-[#D97706]' },
    { label: 'Comms Network', val: '99.4%', status: 'VHF / BLE Active', color: 'text-[#2E7D32]' },
  ];

  return (
    <div className="space-y-5 text-slate-800 font-sans">

      {/* ── Top Telemetry / Operational Metric Cards Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {metricCards.map((m, idx) => (
          <div
            key={idx}
            className="p-3 bg-white border border-[#D7DEE7] rounded-lg text-left shadow-xs hover:border-[#1565C0] transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block truncate">
              {m.label}
            </span>
            <span className={`text-lg sm:text-xl font-extrabold ${m.color} block mt-0.5 font-mono leading-tight`}>
              {m.val}
            </span>
            <span className="text-[10px] font-medium text-slate-600 block mt-0.5 truncate">
              {m.status}
            </span>
          </div>
        ))}
      </div>

      {/* ── Quick Officer Inspection Strip (Clickable to open OfficerDrawer) ── */}
      <div className="bg-white border border-[#D7DEE7] rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B3D6E]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">
              Field Officers on Duty ({mockOfficers.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Select any officer profile to inspect credentials, live sector &amp; reassign duties
            </p>
          </div>
        </div>

        {/* Quick Officer Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {mockOfficers.map((officer) => (
            <button
              key={officer.id}
              type="button"
              onClick={() => handleSelectOfficer(officer)}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all shrink-0 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center text-[10px] font-bold">
                {officer.name.charAt(0)}
              </div>
              <div className="text-[11px]">
                <div className="font-bold text-slate-900 group-hover:text-[#1565C0] leading-tight">
                  {officer.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {officer.id} • <span className={officer.status === 'On Field' ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>{officer.status}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── State-Based Tab Switcher ── */}
      <div className="bg-white border border-[#D7DEE7] rounded-lg p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-[#0B3D6E] text-white shadow-xs'
                : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Field Battalions &amp; Unit Roster</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeTab === 'roster' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              Roster Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dispatch'
                ? 'bg-[#0B3D6E] text-white shadow-xs'
                : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Pending Emergency Dispatch</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeTab === 'dispatch' ? 'bg-blue-800 text-blue-100' : 'bg-amber-100 text-amber-800'
              }`}
            >
              3 Queued
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-3 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>DEOC Field Command Engine Online</span>
        </div>
      </div>

      {/* ── Tab Viewport ── */}
      <div className="transition-opacity duration-150">
        {activeTab === 'roster' && (
          <WorkforceManagement onSelectOfficer={handleSelectOfficer} />
        )}
        {activeTab === 'dispatch' && (
          <WorkforceConsole onSelectOfficer={handleSelectOfficer} />
        )}
      </div>

      {/* ── Slide-Out Officer Drawer ── */}
      <OfficerDrawer
        officer={selectedOfficer}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />

    </div>
  );
}
