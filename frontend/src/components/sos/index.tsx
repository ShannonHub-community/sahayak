'use client';

import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { SOSForm } from '@/components/SOSForm';
import { CompassDisplay } from '@/components/CompassDisplay';
import type { SOSResponse } from '@/types/sos';
import { AlertOctagon, PhoneCall, ShieldAlert, Radio, ArrowRight, HeartHandshake } from 'lucide-react';

function DonationPortalCard() {
  return (
    <Link
      href="/citizen/donation"
      className="w-full bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200/80 border-2 border-emerald-600 hover:border-emerald-700 rounded-sm p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3 sm:gap-4 transition-all group text-left"
      title="Contribute essential supplies, medical inventory, or funds to relief operations"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-sm bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <HeartHandshake className="w-6 h-6 text-emerald-700" />
        </div>
        <div className="min-w-0">
          <div className="text-slate-900 font-extrabold text-sm sm:text-base leading-tight group-hover:text-emerald-950 transition-colors">
            CONTRIBUTE TO RELIEF EFFORTS / राहत सहयोग
          </div>
          <p className="text-slate-700 text-xs sm:text-sm font-medium mt-0.5">
            Donate Supplies &amp; Funds • Food, Medical &amp; Financial Aid
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-emerald-700 group-hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-sm shadow-xs flex-shrink-0 transition-colors">
        <span className="hidden sm:inline">Donate Now</span>
        <span className="sm:hidden">Donate</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  // Page states: 'collapsed' (big centered button) | 'expanded' (in-place form) | 'submitted' (compass guidance)
  const [viewState, setViewState] = useState<'collapsed' | 'expanded' | 'submitted'>('collapsed');
  const [sosResult, setSosResult] = useState<SOSResponse | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  const handleOpenForm = () => {
    setViewState('expanded');
    setTimeout(() => {
      mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCancelForm = () => {
    setViewState('collapsed');
  };

  const handleSubmitSuccess = (response: SOSResponse) => {
    setSosResult(response);
    setViewState('submitted');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSosResult(null);
    setViewState('collapsed');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <Head>
        <title>Sahayak Emergency Portal | National Citizen SOS</title>
      </Head>

      {/* Official Government Header */}
      <GovHeader onSkipToContent={() => mainContentRef.current?.focus()} />

      {/* Main Content Area */}
      <main
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col justify-center outline-none"
      >
        {/* STATE 1: COLLAPSED — Dead-Centered Large SOS Button */}
        {viewState === 'collapsed' && (
          <div className="w-full flex flex-col items-center justify-center my-auto py-8">
            <div className="w-full max-w-lg text-center space-y-6">
              {/* National Alert Context & Live News Link */}
              <Link
                href="/citizen/news-report"
                className="bg-white hover:bg-red-50/60 border border-gray-300 hover:border-red-300 rounded-sm p-3 shadow-xs flex items-center justify-between gap-2 text-xs font-semibold text-gray-700 group transition-all"
                title="View real-time disaster alerts, dam releases, and evacuation advisories"
              >
                <div className="flex items-center gap-2 text-left">
                  <Radio className="w-4 h-4 text-red-600 animate-pulse flex-shrink-0" />
                  <span className="group-hover:text-red-700 transition-colors">
                    Pan-India Emergency Response Active • <span className="underline decoration-red-400 font-bold">Live News &amp; Bulletins</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#0B3D6E] group-hover:text-red-600 flex items-center gap-0.5 flex-shrink-0">
                  <span>View Feed</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              {/* Big Centered Primary SOS Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleOpenForm}
                  aria-label="Report Emergency Help Immediately"
                  className="w-full min-h-[140px] sm:min-h-[170px] bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] text-white rounded-sm p-6 sm:p-8 border-4 border-[#B71C1C] shadow-lg flex flex-col items-center justify-center gap-2.5 transition-all text-center group select-none"
                >
                  <AlertOctagon className="w-12 h-12 sm:w-16 sm:h-16 text-white group-hover:scale-105 transition-transform" />
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase leading-none">
                    REPORT HELP / आपातकालीन सहायता
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-red-100 uppercase tracking-wider">
                    Tap to transmit GPS location & citizen count
                  </span>
                </button>
              </div>

              {/* Public Relief & Donation Portal Card */}
              <DonationPortalCard />

              {/* Direct News Report & Evacuation Advisories Link Button */}
              <Link
                href="/citizen/news-report"
                className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-[#0B3D6E] hover:text-[#07284B] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-sm border-2 border-[#0B3D6E] shadow-sm flex items-center justify-center gap-2 transition-all group"
              >
                <Radio className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>OFFICIAL DISASTER BULLETINS &amp; NEWS / समाचार एवं अलर्ट</span>
                <ArrowRight className="w-4 h-4 text-[#0B3D6E] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Direct Telephone Fallback */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="tel:112"
                  className="w-full sm:w-auto bg-[#0B3D6E] hover:bg-[#07284B] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-sm border border-blue-900 shadow flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-[#FF9933]" />
                  <span>DIRECT VOICE CALL: 112</span>
                </a>

                <div className="text-[11px] text-gray-600 text-center sm:text-left flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span>Works online and offline via automated SMS dispatch.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: EXPANDED — In-Place SOS Form */}
        {viewState === 'expanded' && (
          <div className="w-full my-auto animate-fadeIn space-y-6">
            <SOSForm onCancel={handleCancelForm} onSubmitSuccess={handleSubmitSuccess} />

            {/* Secondary Action Card below SOS Form */}
            <div className="pt-2">
              <DonationPortalCard />
            </div>
          </div>
        )}

        {/* STATE 3: SUBMITTED — Post-Submit Compass & Relief Guidance */}
        {viewState === 'submitted' && sosResult && (
          <div className="w-full my-auto animate-fadeIn">
            {sosResult.nearest_shelter ? (
              <CompassDisplay
                shelter={sosResult.nearest_shelter}
                reportId={sosResult.report_id}
                onReset={handleReset}
              />
            ) : (
              <div className="bg-white border-2 border-emerald-600 rounded-sm p-6 shadow-md text-center space-y-4">
                <div className="text-emerald-700 font-bold text-lg">
                  SOS RECEIVED & QUEUED FOR DISPATCH
                </div>
                <p className="text-sm text-gray-700">
                  {sosResult.message}
                </p>
                <div className="text-xs font-mono bg-gray-100 p-2 rounded text-gray-800">
                  Ref ID: {sosResult.report_id}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-[#0B3D6E] text-white text-xs font-semibold px-4 py-2 rounded-sm"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
}
