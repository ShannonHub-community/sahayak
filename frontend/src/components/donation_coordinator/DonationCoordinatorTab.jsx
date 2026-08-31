'use client';

import React from 'react';
import { LeftPanelIncomingHelp } from './LeftPanelIncomingHelp';
import { CenterPanelResourceMatrix } from './CenterPanelResourceMatrix';
import { RightPanelActionBridge } from './RightPanelActionBridge';
import { AddDonationModal } from './AddDonationModal';
import { DonationDetailModal } from './DonationDetailModal';
import { PublicBroadcastModal } from './PublicBroadcastModal';
import { WorkforceDemandModal } from './WorkforceDemandModal';
import { CertificateModal } from './CertificateModal';
import { LOCATIONS } from '../mock/initialData';
import { useLedger } from '../context/LedgerContext';
import { Layers, Building, ShieldCheck } from 'lucide-react';

export const DonationCoordinatorTab = () => {
  const { selectedSector, setSelectedSector, requests, inventory, certificates } = useLedger();

  const pendingRequestsCount = requests.filter((r) => r.requestStatus === 'Pending').length;
  const approvedRequestsCount = requests.filter((r) => r.requestStatus === 'Approved').length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-200">
      {/* Top Sector & Summary Filter Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#0B3D6E]/10 text-[#0B3D6E] rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Disaster Donation Coordinator & Resource Induction Matrix
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Multi-channel verification, shelter allocation, and cryptographic certificate issuance
            </p>
          </div>
        </div>

        {/* Sector Filter & Stat Badges */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Sector Filter:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
              {pendingRequestsCount} Pending Review
            </span>
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {approvedRequestsCount} Inducted
            </span>
          </div>
        </div>
      </div>

      {/* 3-Panel Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Panel: Incoming Help (3.5 cols) */}
        <div className="lg:col-span-4 xl:col-span-3.5 h-full overflow-hidden">
          <LeftPanelIncomingHelp />
        </div>

        {/* Center Panel: Resource Matrix (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5.5 h-full overflow-hidden">
          <CenterPanelResourceMatrix />
        </div>

        {/* Right Panel: Action Bridge (3 cols) */}
        <div className="lg:col-span-3 xl:col-span-3 h-full overflow-y-auto pr-1">
          <RightPanelActionBridge />
        </div>
      </div>

      {/* Modals Mounted Globally for this Tab */}
      <AddDonationModal />
      <DonationDetailModal />
      <PublicBroadcastModal />
      <WorkforceDemandModal />
      <CertificateModal />
    </div>
  );
};

export default DonationCoordinatorTab;
