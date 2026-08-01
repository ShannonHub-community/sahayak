"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800">Sahayak - Gov Portal</h1>
      <p className="text-slate-500 text-sm">Panvel Emergency Management & Realtime Map</p>

      <MapView />
    </main>
  );
}