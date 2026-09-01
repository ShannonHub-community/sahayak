'use client';

import dynamic from 'next/dynamic';

const AuditLogTab = dynamic(
  () => import('@/components/audit_log/AuditLogTab'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#0B3D6E]" />
          <p className="text-sm font-semibold text-slate-700">Loading Audit Log &amp; Ticket Ledger...</p>
        </div>
      </div>
    ),
  }
);

export default function AdminAuditLogPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <AuditLogTab />
    </div>
  );
}
