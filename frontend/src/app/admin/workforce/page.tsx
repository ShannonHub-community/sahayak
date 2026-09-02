'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Users, Home, ShieldAlert, PackageCheck, FileSpreadsheet, Radio } from 'lucide-react';

const WorkforceDashboard = dynamic(
  () => import('@/components/workforce_portal/WorkforceDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#0B3D6E]" />
          <p className="text-xs font-semibold text-slate-600">
            Loading NDRF Field Commander Portal...
          </p>
        </div>
      </div>
    ),
  }
);

export default function AdminWorkforcePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-slate-900">

      {/* Portal Header */}
      <header className="bg-[#0B3D6E] text-white border-b border-[#082C50] shadow-md sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#FF9933] text-black font-extrabold uppercase px-1.5 py-0.5 rounded-sm">
                  NDMA / GOI
                </span>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                  SAHAYAK Field Commander Portal
                </h1>
              </div>
              <p className="text-[11px] text-blue-200">
                NDRF / SDRF Unit Dispatch Queue - Workforce Assignment and Status Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-md text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>FIELD COMMAND ACTIVE</span>
            </div>

            <Link
              href="/admin/resource-ledger"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Logistics &amp; Shelter Ledger"
            >
              <PackageCheck className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Logistics</span>
            </Link>

            <Link
              href="/admin/twin"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Digital Twin Map"
            >
              <Radio className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Digital Twin</span>
            </Link>

            <Link
              href="/admin/audit-log"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Audit &amp; System Logs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Audit</span>
            </Link>

            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
              title="Return to Citizen Portal"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Admin Dashboard Container */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 space-y-5">
        <WorkforceDashboard />
      </main>

    </div>
  );
}
