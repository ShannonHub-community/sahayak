'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically load CitizenSOSHomePage with SSR disabled for Leaflet / MapLibre compatibility
const CitizenSOSHomePage = dynamic(
  () => import('@/components/sos'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#D32F2F]" />
          <p className="text-sm font-semibold text-slate-700">
            Initializing National Emergency SOS Portal...
          </p>
        </div>
      </div>
    ),
  }
);

export default function CitizenPage() {
  return <CitizenSOSHomePage />;
}
