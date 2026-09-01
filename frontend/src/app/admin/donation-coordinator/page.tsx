'use client';

import dynamic from 'next/dynamic';
import { LedgerProvider } from '@/context/LedgerContext';

const LeftPanelIncomingHelp = dynamic(
  () =>
    import('@/components/donation_coordinator/LeftPanelIncomingHelp').then(
      (mod) => mod.LeftPanelIncomingHelp
    ),
  { ssr: false }
);

const CenterPanelResourceMatrix = dynamic(
  () =>
    import('@/components/donation_coordinator/CenterPanelResourceMatrix').then(
      (mod) => mod.CenterPanelResourceMatrix
    ),
  { ssr: false }
);

export default function AdminDonationCoordinatorPage() {
  return (
    <LedgerProvider>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Left Panel: Incoming Donation Tickets */}
        <div className="w-[38%] min-h-screen border-r border-slate-200">
          <LeftPanelIncomingHelp />
        </div>

        {/* Center Panel: Resource Matrix & Verification */}
        <div className="flex-1 min-h-screen">
          <CenterPanelResourceMatrix />
        </div>
      </div>
    </LedgerProvider>
  );
}
