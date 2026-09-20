import Link from 'next/link';
import DigitalTwinMap from '@/components/digital_twin/DigitalTwinMap';
import CommandCenter from '@/components/ai_decision/CommandCenter';
import { Radio, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'EOC Commander — Digital Twin | Sahayak',
  description: 'Real-time 3D GIS Digital Twin map and AI Command Center for NDRF/SDRF incident commanders.',
};

export default function AdminTwinPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">

      {/* ── EOC Quick-Access Action Bar (page-scoped, not in any shared header) ── */}
      <div className="shrink-0 h-10 bg-[#0B3D6E] border-b border-[#082C50] flex items-center px-4 gap-3 z-40">
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mr-2">
          EOC Commander
        </span>
        <Link
          href="/admin/public-comms"
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-amber-300" />
          Public Comms
        </Link>
        <Link
          href="/admin/audit-log"
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
          Audit Log
        </Link>
        <Link
          href="/admin/damage-reports"
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Damage Reports (PDNA)
        </Link>
      </div>

      {/* ── Map + AI Panel (fills remaining viewport height) ── */}
      <main className="flex flex-1 min-h-0 w-full">
        {/* Left Side: Digital Twin Map (70% width) */}
        <div className="w-[70%] h-full relative">
          <DigitalTwinMap />
        </div>

        {/* Right Side: AI Command Center (30% width) */}
        <div className="w-[30%] h-full border-l border-slate-200">
          <CommandCenter />
        </div>
      </main>

    </div>
  );
}
