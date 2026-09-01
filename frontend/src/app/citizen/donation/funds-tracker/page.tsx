'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { LedgerProvider } from '@/context/LedgerContext';
import { ArrowLeft, TrendingUp } from 'lucide-react';

const FundsTrackerWidget = dynamic(
  () =>
    import('@/components/donation_portal/FundsTrackerWidget').then(
      (mod) => mod.FundsTrackerWidget
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-700">Loading Funds Tracker...</p>
        </div>
      </div>
    ),
  }
);

export default function FundsTrackerPage() {
  return (
    <LedgerProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
        <GovHeader />

        <div className="bg-white border-b border-gray-300 py-2 px-3 sm:px-6">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-gray-600">
            <Link href="/citizen/donation" className="hover:text-[#0B3D6E] flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Donation Portal</span>
            </Link>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Public Funds Tracker
            </span>
          </div>
        </div>

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <FundsTrackerWidget />
        </main>

        <GovFooter />
      </div>
    </LedgerProvider>
  );
}
