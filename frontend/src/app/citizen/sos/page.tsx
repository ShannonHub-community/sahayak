'use client';

import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('@/components/sos/index'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#F4F6F8]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#0B3D6E]" />
        <p className="text-sm font-semibold text-slate-700">
          Loading SOS Emergency Portal...
        </p>
      </div>
    </div>
  ),
});

export default function CitizenSosPage() {
  return <HomePage />;
}
