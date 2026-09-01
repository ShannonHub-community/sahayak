'use client';

import dynamic from 'next/dynamic';

const WorkforceQueue = dynamic(
  () =>
    import('@/components/resource_manager/WorkforceQueue').then(
      (mod) => mod.WorkforceQueue
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#0B3D6E]" />
          <p className="text-sm font-semibold text-slate-700">Loading NDRF Workforce Dispatch Queue...</p>
        </div>
      </div>
    ),
  }
);

export default function AdminWorkforcePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <WorkforceQueue />
    </div>
  );
}
