'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, ArrowLeft, Radio, Shield, Info } from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';

export default function IvrPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans text-slate-900">
      {/* National Portal Standard Header */}
      <GovHeader />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link
            href="/citizen"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0B3D6E] hover:text-[#07284B] bg-white border border-slate-300 hover:border-slate-400 px-3.5 py-1.5 rounded-sm shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Home / मुख्य पृष्ठ</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono">IVR SIMULATOR 112</span>
          </div>
        </div>

        {/* Page Header Banner */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0B3D6E]/10 rounded text-[#0B3D6E]">
                <PhoneCall className="w-6 h-6 text-[#0B3D6E]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#07284B]">
                  IVR Emergency Call Simulator
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Simulated 9-step emergency helpline for feature phones & non-smartphone users.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded text-xs self-start sm:self-auto">
              <Shield className="w-4 h-4 text-[#0B3D6E] flex-shrink-0" />
              <div>
                <span className="font-semibold text-[#0B3D6E]">Non-Smartphone Flow</span>
                <span className="block text-[11px] text-slate-500">DTMF & Audio Capture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Workspace Area */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-8 text-center my-auto flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#0B3D6E]/10 flex items-center justify-center text-[#0B3D6E]">
            <PhoneCall className="w-8 h-8 text-[#0B3D6E]" />
          </div>
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-[#07284B]">IVR Simulator Initialized</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              The IVR workspace route is ready. Step 1 will mount the interactive DTMF keypad and 9-step emergency intake simulator here.
            </p>
          </div>
        </div>

        {/* Protocol Notice */}
        <div className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-sm text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              NDMA Interactive Voice Response Protocol (9-Step Intake)
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Designed for low-bandwidth and basic 2G/3G handsets with backend Speech-to-Text (STT) processing.
            </p>
          </div>
        </div>
      </main>

      {/* Standard Footer */}
      <footer className="bg-[#07284B] text-white text-xs py-4 px-4 text-center mt-auto border-t border-blue-900">
        <p className="text-blue-200">
          Government of India • National Disaster Management Authority (NDMA) • Emergency Telephony Simulation
        </p>
      </footer>
    </div>
  );
}
