import React from 'react';
import Link from 'next/link';
import { 
  AlertOctagon, 
  ShieldAlert, 
  PhoneCall, 
  Radio, 
  Activity, 
  MapPin, 
  Users, 
  FileText, 
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  PackageCheck,
  Megaphone,
  Building2,
  CheckCircle2,
  Flame,
  LifeBuoy
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';

export const metadata = {
  title: 'Sahayak Emergency Management & Response System | GOI / NDMA',
  description: 'National Unified Disaster Management Gateway connecting citizens, emergency responders, AI decision support, and EOC command operations.',
};

export default function UnifiedGatewayPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      {/* Official Government Header */}
      <GovHeader />

      {/* Main Gateway Hero Section */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center space-y-10">
        
        {/* Top National Advisory Badge & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-[#0B3D6E] px-3.5 py-1 rounded-full border border-blue-200 text-xs font-extrabold uppercase tracking-wider shadow-xs">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>Pan-India Disaster Management & Multi-Agency Coordination Grid</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B3D6E] tracking-tight leading-tight">
            सहायक <span className="text-slate-800">| Sahayak Emergency Management & Response System</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Integrated multi-domain disaster operations platform by Government of India (GOI) and National Disaster Management Authority (NDMA), connecting citizens in distress with automated AI command triage, GIS digital twins, and operational logistics ledgers.
          </p>
        </div>

        {/* THREE PRIMARY OPERATIONAL DOMAIN LAUNCH CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* CARD 1: CITIZEN EMERGENCY PORTAL */}
          <div className="bg-white border-2 border-red-600 rounded-xl p-6 sm:p-7 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 group-hover:scale-105 transition-transform">
                  <AlertOctagon className="w-8 h-8 text-[#D32F2F]" />
                </div>
                <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 uppercase">
                  PUBLIC & CITIZEN
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Citizen Emergency Portal
                </h2>
                <div className="text-xs font-semibold text-red-700 mt-0.5">
                  नागरिक आपातकालीन सेवा एवं सहायता
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Live SOS reporting with GPS distress signals, instant bearing compass to nearest relief shelters, household pre-registration, real-time public disaster bulletins, and community donation portal.
              </p>

              {/* Sub-portal Quick Links */}
              <div className="space-y-1.5 pt-2">
                <Link
                  href="/citizen"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-red-700 bg-slate-50 hover:bg-red-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Emergency SOS & Shelter Compass</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/citizen/register"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Household Pre-Registration</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/citizen/updates"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-amber-700 bg-slate-50 hover:bg-amber-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-amber-600" />
                    <span>Live Advisories & Dam Alerts</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/citizen/donate"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Public Donation & Relief Offers</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-6 relative z-10">
              <Link
                href="/citizen"
                className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 transition-all group-hover:gap-2.5"
              >
                <span>Launch Citizen Portal</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          </div>


          {/* CARD 2: AI DISASTER COMMAND CENTER */}
          <div className="bg-white border-2 border-slate-800 rounded-xl p-6 sm:p-7 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-100 text-[#0B3D6E] rounded-lg border border-slate-300 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-8 h-8 text-[#0B3D6E]" />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#0B3D6E] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase">
                  GIS & AI ENGINE
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  AI Command Center
                </h2>
                <div className="text-xs font-semibold text-[#0B3D6E] mt-0.5">
                  आपदा नियंत्रण कक्ष एवं डिजिटल ट्विन
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Incident Commander Console featuring real-time 3D GIS Digital Twin map, live telemetry tracking for NDRF/SDRF assets, and Lyzr automated SOP decision support.
              </p>

              {/* Command Center Feature Badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-200">
                  <Layers className="w-3.5 h-3.5 text-[#0B3D6E] shrink-0" />
                  <span>3D GIS Digital Twin</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Lyzr SOP Engine</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-200">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Live Telemetry Grid</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Multi-Agency Triage</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-6 relative z-10">
              <Link
                href="/admin"
                className="w-full bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 transition-all group-hover:gap-2.5"
              >
                <span>Launch AI Command Center</span>
                <ArrowRight className="w-4 h-4 text-[#FF9933]" />
              </Link>
            </div>
          </div>


          {/* CARD 3: EOC OPERATIONS & AUDIT HUB */}
          <div className="bg-white border-2 border-slate-700 rounded-xl p-6 sm:p-7 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-700" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 uppercase">
                  OPERATIONS & LOGISTICS
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  EOC Operations & Ledger
                </h2>
                <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                  कार्यकारी संचालन एवं संसाधन बहीखाता
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Central EOC Operations dashboard housing the immutable audit trail, live shelter & supply inventory ledger, multi-channel public communications, and donation coordinator matrix.
              </p>

              {/* Sub-tab Quick Links */}
              <div className="space-y-1.5 pt-2">
                <Link
                  href="/admin/operations?tab=audit"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-[#0B3D6E] bg-slate-50 hover:bg-blue-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Audit Trail & Inquiries</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/admin/operations?tab=resources"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resource & Shelter Ledger</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/admin/operations?tab=comms"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-purple-700 bg-slate-50 hover:bg-purple-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-purple-600" />
                    <span>Public Communications Matrix</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/admin/operations?tab=donations"
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-amber-700 bg-slate-50 hover:bg-amber-50/60 p-2 rounded-md border border-slate-200 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Donation Coordinator Matrix</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-6 relative z-10">
              <Link
                href="/admin/operations"
                className="w-full bg-[#1e293b] hover:bg-[#0f172a] active:bg-black text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-md shadow-md flex items-center justify-center gap-2 transition-all group-hover:gap-2.5"
              >
                <span>Launch EOC Operations Hub</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </Link>
            </div>
          </div>

        </div>

        {/* Direct Helpline & Quick Info Bar */}
        <div className="bg-white border border-gray-300 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">National Emergency Voice Helpline: 112</div>
              <div className="text-xs text-slate-500">Toll-free immediate central dispatch for Police, Fire, NDRF & Medical rescue</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/citizen/register"
              className="text-xs font-bold text-[#0B3D6E] hover:bg-blue-50 px-3.5 py-2 rounded-md border border-blue-200 transition-colors"
            >
              Pre-Register Household
            </Link>
            <Link
              href="/admin/operations"
              className="text-xs font-bold text-slate-700 hover:bg-slate-100 px-3.5 py-2 rounded-md border border-slate-300 transition-colors"
            >
              Operations Console
            </Link>
          </div>
        </div>

      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
