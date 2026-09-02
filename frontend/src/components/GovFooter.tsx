import React from 'react';
import { Shield, PhoneCall, Radio, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const GovFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#07284B] text-white text-xs border-t-2 border-[#0B3D6E] mt-auto">
      {/* Tricolour Stripe */}
      <div className="gov-tricolour-stripe" aria-hidden="true" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-slate-300">
          {/* Col 1: Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-[#FF9933]" />
              <span>सहायक | SAHAYAK</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unified National Disaster Management, Emergency Citizen SOS & Multi-Agency Incident Response Grid.
            </p>
            <div className="text-[10px] text-slate-400 font-mono">
              NDMA / Ministry of Home Affairs, GoI
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <div className="font-bold text-white uppercase text-[11px] tracking-wider text-blue-200">
              Citizen Channels
            </div>
            <ul className="space-y-1 text-[11px]">
              <li>
                <Link href="/citizen/sos" className="hover:text-[#FF9933] transition-colors">
                  Emergency SOS Report
                </Link>
              </li>
              <li>
                <Link href="/citizen/news-report" className="hover:text-[#FF9933] transition-colors">
                  Live Alerts &amp; News Bulletins
                </Link>
              </li>
              <li>
                <Link href="/citizen/register" className="hover:text-[#FF9933] transition-colors">
                  Pre-Register Household
                </Link>
              </li>
              <li>
                <Link href="/admin/twin" className="hover:text-[#FF9933] transition-colors flex items-center gap-1">
                  <span>EOC Command Center (Admin)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: National Helplines */}
          <div className="space-y-2">
            <div className="font-bold text-white uppercase text-[11px] tracking-wider text-blue-200">
              National 24x7 Helplines
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">National Emergency:</span>
                <a href="tel:112" className="font-bold text-[#FF9933] hover:underline">112</a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ambulance:</span>
                <a href="tel:108" className="font-bold text-[#FF9933] hover:underline">108</a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NDRF Helpline:</span>
                <a href="tel:1078" className="font-bold text-[#FF9933] hover:underline">1078</a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Disaster Control:</span>
                <a href="tel:1070" className="font-bold text-[#FF9933] hover:underline">1070</a>
              </div>
            </div>
          </div>

          {/* Col 4: Resilience Badge */}
          <div className="space-y-2 bg-blue-950/60 p-3 rounded border border-blue-900/80">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Radio className="w-3.5 h-3.5" />
              <span>OFFLINE MESH READY</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-normal">
              This application caches emergency protocols locally and generates SMS-based 112 dispatches during network blackouts.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-900/60 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 National Disaster Management Platform (Sahayak) • Developed for National Emergency Response
          </div>
          <div className="text-slate-400">
            Government of India / NDMA
          </div>
        </div>
      </div>
    </footer>
  );
};
