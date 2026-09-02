'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  PackageCheck,
  Building2,
  Clock,
  ShieldAlert,
  Home,
} from 'lucide-react';
import { LedgerProvider } from '@/context/LedgerContext';

// ---------------------------------------------------------------------------
// Dynamic imports — SSR disabled (Leaflet / real-time browser stores)
// ---------------------------------------------------------------------------
const ResourceManagerTab = dynamic(
  () => import('@/components/resource_manager/ResourceManagerTab'),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton title="Resource & Shelter Ledger" />,
  }
);

const DonationCoordinatorTab = dynamic(
  () =>
    import('@/components/donation_coordinator/DonationCoordinatorTab').then(
      (mod) => mod.DonationCoordinatorTab ?? mod.default
    ),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton title="Donation Coordinator Matrix" />,
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function TabLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="flex h-96 w-full items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#0B3D6E]" />
        <p className="text-xs font-semibold text-slate-600">Loading {title}…</p>
      </div>
    </div>
  );
}

type TabType = 'resources' | 'donations';

// ---------------------------------------------------------------------------
// Main portal component (needs useSearchParams — must be in Suspense)
// ---------------------------------------------------------------------------
function LogisticsPortal() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) ?? 'resources';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live IST clock — ported from the old operations/page.tsx
  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge: string }[] = [
    {
      id: 'resources',
      label: 'Resources & Shelters',
      icon: <PackageCheck className="w-4 h-4" />,
      badge: 'Active Assets',
    },
    {
      id: 'donations',
      label: 'Donations & Verifications',
      icon: <Building2 className="w-4 h-4" />,
      badge: 'Induction Hub',
    },
  ];

  return (
    <LedgerProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-slate-900">

        {/* ── Portal Header ──────────────────────────────────────────── */}
        <header className="bg-[#0B3D6E] text-white border-b border-[#082C50] shadow-md sticky top-0 z-30">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">

            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#FF9933] text-black font-extrabold uppercase px-1.5 py-0.5 rounded-sm">
                    NDMA / GOI
                  </span>
                  <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                    SAHAYAK Logistics & Donations Command
                  </h1>
                </div>
                <p className="text-[11px] text-blue-200">
                  Resource Ledger · Shelter Tracking · Donation Induction Matrix
                </p>
              </div>
            </div>

            {/* Right status bar */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="hidden md:flex items-center gap-1.5 bg-black/20 border border-white/15 px-3 py-1.5 rounded-md text-xs font-mono text-blue-100">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentTime || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-md text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LOGISTICS GRID ONLINE</span>
              </div>
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

        {/* ── Main Content ────────────────────────────────────────────── */}
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col space-y-4">

          {/* Tab Navigation Strip */}
          <div className="bg-white rounded-xl border border-slate-300 p-1.5 shadow-sm flex flex-wrap items-center gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B3D6E] text-white shadow-sm'
                      : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Viewport */}
          <div className="flex-1 min-h-0">
            {activeTab === 'resources' && (
              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                <ResourceManagerTab />
              </div>
            )}
            {activeTab === 'donations' && (
              <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm overflow-hidden">
                <DonationCoordinatorTab />
              </div>
            )}
          </div>

        </main>
      </div>
    </LedgerProvider>
  );
}

// ---------------------------------------------------------------------------
// Page export — Suspense required for useSearchParams
// ---------------------------------------------------------------------------
export default function AdminResourceLedgerPage() {
  return (
    <Suspense
      fallback={<TabLoadingSkeleton title="Logistics & Donations Command" />}
    >
      <LogisticsPortal />
    </Suspense>
  );
}
