import React from 'react';
import Link from 'next/link';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import {
  Radio,
  PhoneCall,
  Wifi,
  WifiOff,
  Shield,
  Map,
  Users,
  Heart,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Smartphone,
} from 'lucide-react';

export const metadata = {
  title: 'About Sahayak | India\'s Hybrid Offline Emergency Response Platform',
  description:
    'Sahayak is a NDMA-aligned disaster management platform combining IVR telephony, BLE mesh networking, AI-powered digital twin, and offline-first architecture for zero-connectivity emergency response.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] font-sans">
      <GovHeader />

      {/* Hero Banner */}
      <div className="bg-[#07284B] text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
                National Disaster Management Authority (NDMA) — Government of India
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                Sahayak Emergency Response Platform
              </h1>
            </div>
          </div>
          <p className="text-blue-200 text-sm sm:text-base leading-relaxed max-w-3xl">
            A unified, hybrid offline-first emergency management system designed for India's
            last-mile connectivity challenges. Built to operate when internet fails, cell towers
            are down, and every second counts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-[#07284B] font-bold text-sm px-5 py-2.5 rounded-sm shadow-sm hover:bg-blue-50 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Submit Emergency SOS
            </Link>
            <Link
              href="/citizen/register"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-sm border border-white/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              Pre-Register Household
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">

        {/* Core Problem */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#07284B] mb-3 border-b border-slate-200 pb-2">
            The Problem We Solve
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <WifiOff className="w-5 h-5 text-red-600" />,
                title: 'Network Blackouts',
                desc: 'Cellular towers and internet infrastructure are among the first casualties of floods, earthquakes, and cyclones — leaving victims unable to call for help.',
              },
              {
                icon: <Smartphone className="w-5 h-5 text-amber-600" />,
                title: 'Feature Phone Dependency',
                desc: 'Over 600 million Indians use non-smartphone or 2G devices. Standard digital emergency portals are entirely inaccessible to this population.',
              },
              {
                icon: <Map className="w-5 h-5 text-blue-600" />,
                title: 'Coordination Gaps',
                desc: 'EOC commanders lack real-time visibility of NDRF asset positions, shelter capacities, and AI-validated dispatch decisions — slowing response times.',
              },
            ].map((card) => (
              <div key={card.title} className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
                <div className="p-2.5 bg-slate-50 rounded w-fit mb-3">{card.icon}</div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Three Pillars */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#07284B] mb-3 border-b border-slate-200 pb-2">
            How Sahayak Works — Three Technology Pillars
          </h2>
          <div className="space-y-4">

            {/* Pillar 1: IVR */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-[#0B3D6E] flex-shrink-0">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#07284B] mb-1">
                  Pillar 1 — IVR Telephony (112 Integration)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                  Citizens with any mobile phone — even basic 2G feature phones — can dial the national
                  emergency number and navigate a 9-step interactive voice response system in their native
                  language. The call collects name, location landmark, medical urgency, and number of
                  persons stranded.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Hindi & English', '9-Step DTMF Flow', 'Fast Whisper STT', 'Auto-dispatches to NDRF', 'Zero smartphone required'].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pillar 2: BLE Mesh */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 flex-shrink-0">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#07284B] mb-1">
                  Pillar 2 — BLE Mesh Offline Chat
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                  Using the Web Bluetooth API (GATT Service 0xFFE0), registered citizens within
                  30–50 metres of each other can form an ad-hoc peer-to-peer mesh network with zero
                  internet, zero SIM, and zero cell tower dependency. Messages are ephemeral — never
                  stored on central servers.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Web Bluetooth GATT', 'P2P Encrypted', '30–50m Line-of-Sight', 'Offline First', 'Ephemeral Messages'].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pillar 3: Digital Twin */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex gap-4">
              <div className="p-3 bg-purple-50 rounded-lg text-purple-700 flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#07284B] mb-1">
                  Pillar 3 — AI Command Center &amp; GIS Digital Twin
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                  EOC Incident Commanders access a real-time 3D GIS Digital Twin map showing NDRF/SDRF
                  asset positions, SOS pins, shelter occupancy, and flood zones — all streamed via
                  WebSocket from Supabase. The integrated Lyzr AI engine validates SOP dispatch plans,
                  performs staleness checks, and logs immutable audit tickets for every approved order.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Real-Time GIS Map', 'Lyzr AI SOP Engine', 'WebSocket Telemetry', 'Immutable Audit Log', 'Staleness Validation'].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-100 rounded font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#07284B] mb-3 border-b border-slate-200 pb-2">
            Platform Portals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: '/', label: 'Citizen SOS Portal', desc: 'Submit GPS-tracked emergency distress call', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> },
              { href: '/citizen/ble', label: 'BLE Offline Chat', desc: 'Peer-to-peer mesh without internet', icon: <Radio className="w-4 h-4 text-emerald-600" /> },
              { href: '/citizen/ivr', label: 'IVR Simulator', desc: '9-step phone call emergency intake', icon: <PhoneCall className="w-4 h-4 text-blue-600" /> },
              { href: '/citizen/register', label: 'Pre-Registration', desc: 'Register household & get offline guide', icon: <Shield className="w-4 h-4 text-[#0B3D6E]" /> },
              { href: '/citizen/news-report', label: 'Live Alerts & Updates', desc: 'Public emergency bulletins by state', icon: <Wifi className="w-4 h-4 text-amber-600" /> },
              { href: '/citizen/donation', label: 'Donate Relief Supplies', desc: 'Register material or financial aid', icon: <Heart className="w-4 h-4 text-pink-600" /> },
              { href: '/admin/twin', label: 'EOC Command Center', desc: 'Real-time GIS & AI decision console', icon: <Layers className="w-4 h-4 text-purple-600" /> },
              { href: '/verify', label: 'Verify CSR Certificate', desc: 'Check donation authenticity on ledger', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-white border border-slate-200 hover:border-[#0B3D6E] rounded-sm p-4 shadow-sm transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded">{link.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-[#0B3D6E] transition-colors">{link.label}</p>
                    <p className="text-[11px] text-slate-500">{link.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0B3D6E] flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Compliance */}
        <section className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Standards &amp; Compliance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
            {[
              'NDMA Disaster Management Act 2005',
              'NIC Gov.in Design System',
              'WCAG 2.1 Accessibility',
              'GATT BLE 0xFFE0 Standard',
            ].map((std) => (
              <div key={std} className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="font-medium text-slate-700 leading-tight">{std}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <GovFooter />
    </div>
  );
}
