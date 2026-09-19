'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { LedgerProvider } from '@/context/LedgerContext';
import { ChevronRight, ArrowLeft, HeartHandshake, ShieldCheck } from 'lucide-react';

const PublicDonationPortal = dynamic(
  () =>
    import('@/components/donation_portal/PublicDonationPortal').then(
      (mod) => mod.PublicDonationPortal
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-700">
            Initializing Public Donation Portal &amp; Verified Relief Grid...
          </p>
        </div>
      </div>
    ),
  }
);

export default function CitizenDonationRoute() {
  return (
    <LedgerProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
        {/* Official Government Header */}
        <GovHeader />

        {/* Breadcrumb Navigation Bar */}
        <div className="bg-white border-b border-gray-300 py-2 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-[#0B3D6E] flex items-center gap-1 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Emergency SOS (Home)</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-900">Public Donation &amp; Relief Offer</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/verify"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded border border-emerald-300 transition-colors shadow-xs"
                title="Verify Certificate Authenticity on Public Ledger"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify Certificate</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct EOC Induction Channel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full mx-auto py-4 sm:py-6">
          <PublicDonationPortal />
        </main>

        {/* Official Government Footer */}
        <GovFooter />
      </div>
    </LedgerProvider>
  );
}
