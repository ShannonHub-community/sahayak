'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PhoneCall, 
  Wifi, 
  WifiOff, 
  Shield, 
  Menu, 
  X, 
  UserCheck, 
  AlertOctagon, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { hasOfflineGuides } from '@/services/offlineCache';
import { getBrowserIdentifier } from '@/services/browserIdentifier';

interface GovHeaderProps {
  onSkipToContent?: () => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({ onSkipToContent }) => {
  const pathname = usePathname() || '';
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [offlineGuidesReady, setOfflineGuidesReady] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // Check offline guides and registration status
  const checkStatus = () => {
    setOfflineGuidesReady(hasOfflineGuides());
    setIsRegistered(Boolean(getBrowserIdentifier()));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      checkStatus();

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      const handleCacheUpdate = () => checkStatus();

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('sahayak-offline-cache-updated', handleCacheUpdate);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('sahayak-offline-cache-updated', handleCacheUpdate);
      };
    }
  }, []);

  return (
    <>
      <header className="w-full bg-white border-b border-gray-300 select-none relative z-30">
        {/* Skip to Content for Accessibility */}
        <a
          href="#main-content"
          onClick={(e) => {
            if (onSkipToContent) {
              e.preventDefault();
              onSkipToContent();
            }
          }}
          className="skip-link"
        >
          Skip to main content / मुख्य सामग्री पर जाएं
        </a>

        {/* Tricolour National Stripe */}
        <div className="gov-tricolour-stripe" aria-hidden="true" />

        {/* Top Utility & Identity Bar */}
        <div className="bg-[#07284B] text-white text-xs px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">GOI</span>
            <span>भारत सरकार | Government of India</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            {/* Persistent Offline Guides Badge (Tappable Link to /guides) */}
            {offlineGuidesReady && (
              <Link 
                href="/guides"
                className="flex items-center gap-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-200 border border-emerald-700 hover:border-emerald-500 px-2 py-0.5 rounded font-medium shadow-sm transition-all cursor-pointer"
                title="Tap to view saved offline survival guides & protocols"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Offline Guides Available</span>
                <span className="sm:hidden">Offline Guides</span>
              </Link>
            )}

            {/* Network Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-medium ${
                isOnline
                  ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                  : 'bg-red-950 text-red-200 border border-red-800'
              }`}
              title={isOnline ? 'Connected to National Grid' : 'Offline mode active (SMS ready)'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span>OFFLINE (SMS)</span>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1 text-gray-200">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>NDMA</span>
            </div>
          </div>
        </div>


        {/* Main Gov Identity Header */}
        <div className="bg-[#0B3D6E] text-white px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Secondary Side Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open citizen portal navigation menu"
              className="p-1.5 -ml-1 text-blue-100 hover:text-white hover:bg-white/10 rounded-sm transition-colors flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* National Emblem Icon / Typography */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-sm p-1 flex flex-col items-center justify-center flex-shrink-0 border border-gray-300">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-[#0B3D6E]"
                  fill="currentColor"
                  aria-label="National Emblem of India"
                >
                  <circle cx="50" cy="50" r="44" stroke="#0B3D6E" strokeWidth="4" fill="none" />
                  <circle cx="50" cy="50" r="8" fill="#000080" />
                  <path
                    d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25"
                    stroke="#000080"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none">
                    सहायक <span className="font-semibold text-gray-200">| SAHAYAK</span>
                  </h1>
                  <span className="text-[10px] bg-[#FF9933] text-black font-bold uppercase px-1.5 py-0.2 rounded-sm">
                    CITIZEN
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100 font-normal mt-0.5">
                  National Disaster Management & Citizen Emergency Response Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs sm:text-sm font-bold px-2.5 sm:px-3.5 py-1.5 rounded-sm border border-red-400 transition-colors shadow-sm"
              title="Immediate Police, Fire & Medical Dispatch"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>DIAL 112</span>
            </a>
          </div>
        </div>

        {/* Primary National Navigation Tabs (Accessible & Prominent) */}
        <nav
          aria-label="Portal Primary Navigation"
          className="bg-[#0B3D6E] border-t border-blue-900/60 px-2 sm:px-6 flex items-center overflow-x-auto no-scrollbar justify-between"
        >
          <div className="flex items-center space-x-1 sm:space-x-2 py-1">
            {/* 1. SOS Emergency Tab */}
            <Link
              href="/citizen/sos"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors whitespace-nowrap ${
                pathname === '/citizen/sos' || pathname === '/'
                  ? 'bg-[#07284B] text-white font-bold border-b-2 border-[#FF9933]'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>Emergency SOS</span>
            </Link>

            {/* 2. Citizen Registration Tab */}
            <Link
              href="/citizen/register"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors whitespace-nowrap ${
                pathname === '/citizen/register' || pathname === '/register'
                  ? 'bg-[#07284B] text-white font-bold border-b-2 border-[#FF9933]'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Pre-Register</span>
            </Link>

            {/* 3. Offline BLE Chat */}
            <Link
              href="/citizen/ble"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors whitespace-nowrap border ${
                pathname === '/citizen/ble'
                  ? 'bg-[#07284B] text-white font-bold border-[#FF9933]'
                  : 'text-blue-100 hover:text-white hover:bg-white/10 border-blue-700/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>📶 Offline Chat</span>
            </Link>

            {/* 4. IVR Call Simulator */}
            <Link
              href="/citizen/ivr"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors whitespace-nowrap border ${
                pathname === '/citizen/ivr'
                  ? 'bg-[#07284B] text-white font-bold border-[#FF9933]'
                  : 'text-blue-100 hover:text-white hover:bg-white/10 border-blue-700/60'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              <span>📞 IVR Call Simulator</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Global Sticky Offline Detector Banner */}
      {!isOnline && (
        <div 
          role="alert"
          aria-live="assertive"
          className="sticky top-0 z-40 bg-amber-500 text-slate-900 border-b border-amber-600 px-3 sm:px-6 py-2 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base sm:text-lg">⚠️</span>
            <span>Network connection lost. Offline mesh communications active.</span>
          </div>
          <Link
            href="/citizen/ble"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-sm shadow-sm transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Offline BLE Chat</span>
          </Link>
        </div>
      )}

      {/* Side Navigation Drawer (Modal Menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {/* Drawer Header */}
            <div className="bg-[#0B3D6E] text-white p-4 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF9933]" />
                <span className="font-bold text-sm tracking-wide uppercase">Citizen Portal Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:bg-white/10 p-1.5 rounded transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tricolour Stripe */}
            <div className="gov-tricolour-stripe" />

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2">
                  Portal Navigation
                </div>

                {/* SOS */}
                <Link
                  href="/citizen/sos"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-sm font-semibold transition-colors group ${
                    pathname === '/citizen/sos' || pathname === '/' ? 'bg-blue-50 text-[#0B3D6E]' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertOctagon className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <div>Emergency SOS / आपातकालीन सहायता</div>
                      <div className="text-[11px] font-normal text-gray-500">Live GPS distress &amp; shelter bearing</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* Registration */}
                <Link
                  href="/citizen/register"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-sm font-semibold transition-colors group ${
                    pathname === '/citizen/register' ? 'bg-blue-50 text-[#0B3D6E]' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-[#0B3D6E] group-hover:scale-110 transition-transform" />
                    <div>
                      <div>
                        {isRegistered ? 'Citizen Registration (Active)' : 'Pre-Register Citizen Profile'}
                      </div>
                      <div className="text-[11px] font-normal text-gray-500">
                        {isRegistered ? 'Profile recognized on this device' : 'Save family, medical &amp; offline guides'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* Offline BLE Mesh Chat */}
                <Link
                  href="/citizen/ble"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-sm font-semibold transition-colors group ${
                    pathname === '/citizen/ble' ? 'bg-blue-50 text-[#0B3D6E]' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <div>📶 Offline BLE Mesh Chat / ऑफलाइन मेश चैट</div>
                      <div className="text-[11px] font-normal text-gray-500">Peer-to-peer Web Bluetooth local comms</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* IVR Call Simulator */}
                <Link
                  href="/citizen/ivr"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-sm font-semibold transition-colors group ${
                    pathname === '/citizen/ivr' ? 'bg-blue-50 text-[#0B3D6E]' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PhoneCall className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <div>📞 IVR Call Simulator / आईवीआर कॉल सिम्युलेटर</div>
                      <div className="text-[11px] font-normal text-gray-500">Simulated 9-step non-smartphone intake flow</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>

              <hr className="border-gray-200" />

              {/* Offline Storage Status Card */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm space-y-2">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0B3D6E]" />
                    <span>Device Offline Storage</span>
                  </div>
                  <Link href="/guides" onClick={() => setIsMenuOpen(false)} className="text-[11px] text-[#0B3D6E] underline">
                    View Guides
                  </Link>
                </div>

                <div className="text-[11px] text-gray-600 leading-relaxed">
                  {offlineGuidesReady ? (
                    <div className="text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Personalized offline survival guides & shelter map active.</span>
                    </div>
                  ) : (
                    <div>
                      No offline guides saved yet. Complete pre-registration to download first-aid, flood protocols, and local shelter map.
                    </div>
                  )}
                </div>
              </div>

              {/* National Helplines Box */}
              <div className="bg-[#07284B] text-white p-3 rounded-sm space-y-2">
                <div className="font-bold text-[11px] text-blue-200 uppercase">
                  National Disaster Helplines
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-300 block text-[10px]">National SOS:</span>
                    <a href="tel:112" className="font-bold text-[#FF9933] hover:underline">112</a>
                  </div>
                  <div>
                    <span className="text-gray-300 block text-[10px]">Ambulance:</span>
                    <a href="tel:108" className="font-bold text-[#FF9933] hover:underline">108</a>
                  </div>
                  <div>
                    <span className="text-gray-300 block text-[10px]">NDRF Helpline:</span>
                    <a href="tel:1078" className="font-bold text-[#FF9933] hover:underline">1078</a>
                  </div>
                  <div>
                    <span className="text-gray-300 block text-[10px]">Disaster Control:</span>
                    <a href="tel:1070" className="font-bold text-[#FF9933] hover:underline">1070</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-gray-100 border-t border-gray-200 text-center text-[10px] text-gray-500">
              Sahayak National Citizen Emergency Portal v1.0 • NDMA
            </div>
          </div>
        </div>
      )}
    </>
  );
};

