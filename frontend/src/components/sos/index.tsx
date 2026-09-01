'use client';

import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { SOSForm } from '@/components/SOSForm';
import { CompassDisplay } from '@/components/CompassDisplay';
import type { SOSResponse } from '@/types/sos';
import { AlertOctagon, PhoneCall, ShieldAlert, Radio } from 'lucide-react';

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
              {/* National Alert Context */}
              <div className="bg-white border border-gray-300 rounded-sm p-3 shadow-sm flex items-center justify-center gap-2 text-xs font-semibold text-gray-700">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                <span>Pan-India Emergency Response 24x7 Activated (All States & UTs)</span>
              </div>

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

              {/* Direct Telephone Fallback */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
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
          <div className="w-full my-auto animate-fadeIn">
            <SOSForm onCancel={handleCancelForm} onSubmitSuccess={handleSubmitSuccess} />
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
