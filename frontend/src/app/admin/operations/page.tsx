'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FileSpreadsheet, 
  PackageCheck, 
  Radio, 
  Building2, 
  Map, 
  Home, 
  ShieldAlert, 
  Activity, 
  ChevronRight,
  Clock,
  Layers
} from 'lucide-react';
import { LedgerProvider } from '@/context/LedgerContext';

// Dynamic imports with SSR disabled for Leaflet / real-time browser stores
const AuditLogTab = dynamic(
  () => import('@/components/audit_log/AuditLogTab'),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton title="System Audit Trail & Inquiries" />,
  }
);

const ResourceManagerTab = dynamic(
  () => import('@/components/resource_manager/ResourceManagerTab'),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton title="Resource & Shelter Ledger" />,
  }
);

const PublicCommsModule = dynamic(
  () => import('@/components/public_comms'),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton title="Public Communications & News Matrix" />,
  }
);

const DonationCoordinatorTab = dynamic(
  () =>
    import('@/components/donation_coordinator/DonationCoordinatorTab').then(
      (mod) => mod.DonationCoordinatorTab
    ),
  {
    ssr: false,
    loading: () => <TabLoadingSkeleton title="Donation Coordinator Matrix" />,
  }
);

function TabLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="flex h-96 w-full items-center justify-center bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-200 border-t-[#0B3D6E]" />
        <p className="text-xs font-semibold text-slate-600">Loading {title}...</p>
      </div>
    </div>
  );
}

type TabType = 'audit' | 'resources' | 'comms' | 'donations';

function OperationsDashboard() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'audit';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'audit',
      label: 'Audit Trail & Inquiries',
      icon: <FileSpreadsheet className="w-4 h-4 mr-2" />,
      badge: 'Live Log',
    },
    {
      id: 'resources',
      label: 'Resource & Shelter Ledger',
      icon: <PackageCheck className="w-4 h-4 mr-2" />,
      badge: 'Active Assets',
    },
    {
      id: 'comms',
      label: 'Public Communications',
      icon: <Radio className="w-4 h-4 mr-2" />,
      badge: 'Broadcast Grid',
    },
    {
      id: 'donations',
      label: 'Donation Coordinator Matrix',
      icon: <Building2 className="w-4 h-4 mr-2" />,
      badge: 'Induction Hub',
    },
  ];

  return (
    <LedgerProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-slate-900">
        
        {/* TOP ENTERPRISE COMMAND HEADER */}
        <header className="bg-[#0B3D6E] text-white border-b border-[#082C50] shadow-md sticky top-0 z-30">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            
            {/* Branding & Sub-title */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#FF9933] text-black font-extrabold uppercase px-1.5 py-0.2 rounded-xs">
                    NDMA / GOI
                  </span>
                  <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                    SAHAYAK EOC Operations Command Hub
                  </h1>
                </div>
                <p className="text-[11px] text-blue-200">
                  National Disaster Management Authority — Integrated Incident Command & Operations Console
                </p>
              </div>
            </div>

            {/* Live Operational Status & Quick Nav */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Live Clock */}
              <div className="hidden md:flex items-center gap-1.5 bg-black/20 border border-white/15 px-3 py-1.5 rounded-md text-xs font-mono text-blue-100">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentTime || '11:15:00 IST'}</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-md text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>EOC GRID ONLINE</span>
              </div>

              {/* Quick Link to Digital Twin Map */}
              <Link
                href="/admin/twin"
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/30 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Switch to GIS Digital Twin 3D View"
              >
                <Map className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">GIS Digital Twin</span>
              </Link>

              {/* Home Gateway Link */}
              <Link
                href="/"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                title="Return to Unified Gateway"
              >
                <Home className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </header>

        {/* OPERATIONS CONSOLE CONTAINER */}
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col space-y-4">
          
          {/* TAB NAVIGATION STRIP */}
          <div className="bg-white rounded-xl border border-slate-300 p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#0B3D6E] text-white shadow-sm'
                        : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isActive
                            ? 'bg-blue-800 text-blue-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Context Pill */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-medium px-3">
              <Layers className="w-3.5 h-3.5 text-[#0B3D6E]" />
              <span>Operational Domain: <strong>{tabs.find(t => t.id === activeTab)?.label}</strong></span>
            </div>
          </div>

          {/* ACTIVE TAB MODULE VIEWPORT */}
          <div className="flex-1 min-h-0">
            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-xs">
                <AuditLogTab />
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-xs overflow-hidden">
                <ResourceManagerTab />
              </div>
            )}

            {activeTab === 'comms' && (
              <div className="bg-white rounded-xl border border-slate-300 p-2 shadow-xs overflow-hidden">
                <PublicCommsModule />
              </div>
            )}

            {activeTab === 'donations' && (
              <DonationCoordinatorTab />
            )}
          </div>

        </main>
      </div>
    </LedgerProvider>
  );
}

export default function AdminOperationsPage() {
  return (
    <Suspense fallback={<TabLoadingSkeleton title="EOC Operations Hub" />}>
      <OperationsDashboard />
    </Suspense>
  );
}
