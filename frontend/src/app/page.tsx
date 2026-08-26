'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the PublicCommsModule with SSR disabled for Leaflet map compatibility
const PublicCommsModule = dynamic(
  () => import('@/components/public_commas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#0f2942]" />
          <p className="text-sm font-medium text-slate-600">
            Initializing Public Communications Console...
          </p>
        </div>
      </div>
    ),
  }
);

export default function PublicCommasPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <PublicCommsModule />
    </main>
  );
}