'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { LedgerProvider } from '@/context/LedgerContext';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const PublicVerifyModal = dynamic(
  () =>
    import('@/components/donation_portal/PublicVerifyModal').then(
      (mod) => mod.PublicVerifyModal
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">Loading Certificate Verifier...</p>
        </div>
      </div>
    ),
  }
);

export default function VerifyCertificatePage() {
  return (
    <LedgerProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
        <GovHeader />

        <div className="bg-white border-b border-gray-300 py-2 px-3 sm:px-6">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs text-gray-600">
            <Link href="/citizen/donation" className="hover:text-[#0B3D6E] flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Donation Portal</span>
            </Link>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              CSR Certificate Verification
            </span>
          </div>
        </div>

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#07284B]">
                  SAHAYAK Public Relief Ledger
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify the authenticity of any CSR relief certificate issued by the EOC.
                </p>
              </div>
            </div>
            <PublicVerifyModal />
          </div>
        </main>

        <GovFooter />
      </div>
    </LedgerProvider>
  );
}
