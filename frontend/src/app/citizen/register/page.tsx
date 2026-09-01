'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically load CitizenRegisterPage with SSR disabled for map pin-drop compatibility
const CitizenRegisterPage = dynamic(
  () => import('@/components/registration/register'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#0B3D6E]" />
          <p className="text-sm font-semibold text-slate-700">
            Loading Citizen Pre-Registration Wizard...
          </p>
        </div>
      </div>
    ),
  }
);

export default function CitizenRegisterRoute() {
  return <CitizenRegisterPage />;
}
