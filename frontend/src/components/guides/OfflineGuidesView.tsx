'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Printer, 
  RefreshCw, 
  Trash2, 
  MapPin, 
  HeartPulse, 
  Waves, 
  Stethoscope, 
  FileText, 
  PhoneCall, 
  Download, 
  ChevronRight,
  Copy,
  Check,
  Compass,
  ArrowUpRight,
  HardDriveDownload
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { 
  getCachedGuideBundle, 
  loadDefaultNDMAGuides, 
  clearOfflineGuides, 
  hasOfflineGuides 
} from '@/services/offlineCache';
import type { GuideBundle, LocalShelterGuide } from '@/types/registration';

type GuideTab = 'all' | 'first-aid' | 'flood' | 'shelters' | 'medical';

export default function OfflineGuidesView() {
  const [guideBundle, setGuideBundle] = useState<GuideBundle | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const refreshFromCache = useCallback(() => {
    const cached = getCachedGuideBundle();
    setGuideBundle(cached);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refreshFromCache();

    const handleCacheUpdate = () => refreshFromCache();
    window.addEventListener('sahayak-offline-cache-updated', handleCacheUpdate);
    return () => {
      window.removeEventListener('sahayak-offline-cache-updated', handleCacheUpdate);
    };
  }, [refreshFromCache]);

  const showNotificationMessage = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInstallDefaultGuides = () => {
    const loaded = loadDefaultNDMAGuides();
    setGuideBundle(loaded);
    showNotificationMessage('National NDMA Standard Survival Guides successfully cached to your device.');
  };

  const handleClearGuides = () => {
    if (window.confirm('Are you sure you want to delete all offline survival guides from this device?')) {
      clearOfflineGuides();
      setGuideBundle(null);
      showNotificationMessage('Offline emergency guides removed from device storage.', 'info');
    }
  };

  const handleCopyStep = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasContent = Boolean(
    guideBundle &&
    (guideBundle.first_aid_guide ||
      guideBundle.flood_protocol_guide ||
      (guideBundle.local_shelters && guideBundle.local_shelters.length > 0) ||
      (guideBundle.disease_specific_guides && Object.keys(guideBundle.disease_specific_guides).length > 0))
  );

  // Filtered checks based on search query
  const query = searchQuery.trim().toLowerCase();

  const filteredFirstAid = useMemo(() => {
    if (!guideBundle?.first_aid_guide) return null;
    if (!query) return guideBundle.first_aid_guide;
    const titleMatch = guideBundle.first_aid_guide.title.toLowerCase().includes(query);
    const matchedSteps = guideBundle.first_aid_guide.steps.filter(step => step.toLowerCase().includes(query));
    if (titleMatch || matchedSteps.length > 0) {
      return {
        title: guideBundle.first_aid_guide.title,
        steps: matchedSteps.length > 0 ? matchedSteps : guideBundle.first_aid_guide.steps,
      };
    }
    return null;
  }, [guideBundle, query]);

  const filteredFlood = useMemo(() => {
    if (!guideBundle?.flood_protocol_guide) return null;
    if (!query) return guideBundle.flood_protocol_guide;
    const titleMatch = guideBundle.flood_protocol_guide.title.toLowerCase().includes(query);
    const matchedSteps = guideBundle.flood_protocol_guide.steps.filter(step => step.toLowerCase().includes(query));
    if (titleMatch || matchedSteps.length > 0) {
      return {
        title: guideBundle.flood_protocol_guide.title,
        steps: matchedSteps.length > 0 ? matchedSteps : guideBundle.flood_protocol_guide.steps,
      };
    }
    return null;
  }, [guideBundle, query]);

  const filteredShelters = useMemo(() => {
    if (!guideBundle?.local_shelters) return [];
    if (!query) return guideBundle.local_shelters;
    return guideBundle.local_shelters.filter(
      s => s.name.toLowerCase().includes(query) || s.cardinal.toLowerCase().includes(query) || s.distance.toLowerCase().includes(query)
    );
  }, [guideBundle, query]);

  const filteredDiseases = useMemo(() => {
    if (!guideBundle?.disease_specific_guides) return {};
    if (!query) return guideBundle.disease_specific_guides;
    const result: Record<string, { title: string; protocol: string }> = {};
    for (const [key, item] of Object.entries(guideBundle.disease_specific_guides)) {
      if (
        key.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.protocol.toLowerCase().includes(query)
      ) {
        result[key] = item;
      }
    }
    return result;
  }, [guideBundle, query]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-slate-800">
      <GovHeader />

      <main id="main-content" className="flex-1 pb-16">
        {/* Top Breadcrumb & NDMA Banner */}
        <div className="bg-[#07284B] text-white border-b border-blue-900 py-3 px-4 sm:px-8 shadow-sm">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <nav aria-label="Breadcrumb" className="text-[11px] text-blue-200 flex items-center gap-1.5 font-medium">
                <Link href="/" className="hover:underline text-slate-300">Home</Link>
                <span>/</span>
                <Link href="/citizen/sos" className="hover:underline text-slate-300">Citizen</Link>
                <span>/</span>
                <span className="text-white font-semibold">Offline Survival Guides</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF9933]" />
                <span>Offline Emergency Survival Protocols</span>
                <span className="text-[11px] bg-emerald-700/80 text-emerald-100 border border-emerald-500 font-mono font-medium px-2 py-0.5 rounded ml-1">
                  NDMA STANDARD
                </span>
              </h1>
              <p className="text-xs text-blue-200 max-w-2xl">
                Critical life-saving protocols and nearest relief shelters stored in local device storage for 100% offline availability during power cuts and mobile cellular blackouts.
              </p>
            </div>

            {/* Header Right Status Badge */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold font-mono border ${
                  hasContent
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasContent ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{hasContent ? 'STORAGE READY (OFFLINE)' : 'CACHE EMPTY'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-3">
            <div
              className={`p-3 rounded-md text-xs font-medium border flex items-center justify-between shadow-sm transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-blue-50 border-blue-300 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6">
          {/* Main Action / Search Toolbar */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search emergency steps, medicine, shelters, flood protocols..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D6E] focus:border-transparent bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded text-slate-700 font-medium transition-colors shadow-sm"
                  title="Print emergency protocol manual"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Print Manual</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstallDefaultGuides}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B3D6E] hover:bg-[#07284B] text-white rounded font-semibold transition-colors shadow-sm"
                  title="Refresh or cache NDMA baseline protocols"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{hasContent ? 'Update Guides' : 'Cache NDMA Guides'}</span>
                </button>

                {hasContent && (
                  <button
                    type="button"
                    onClick={handleClearGuides}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded font-medium transition-colors"
                    title="Clear offline storage"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            {hasContent && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'bg-[#0B3D6E] text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Protocols
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('first-aid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'first-aid'
                      ? 'bg-red-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Emergency First-Aid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('flood')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'flood'
                      ? 'bg-blue-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>Flood Evacuation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shelters')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'shelters'
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Relief Shelters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('medical')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'medical'
                      ? 'bg-purple-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Medical Protocols</span>
                </button>
              </div>
            )}
          </div>

          {/* Empty State Card */}
          {!hasContent && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-blue-50 text-[#0B3D6E] rounded-full flex items-center justify-center mx-auto border border-blue-200">
                <HardDriveDownload className="w-8 h-8 text-[#0B3D6E]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">
                  No Offline Guides Cached Yet
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  During extreme flood emergencies or grid failures, internet connectivity can be lost. Offline guides store critical NDMA first-aid protocols, flood escape routes, and relief shelter coordinates locally in your browser.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Why Pre-Register?</span>
                </div>
                <p className="text-amber-800 leading-normal">
                  Completing the citizen pre-registration form tailors your offline cache with specific protocols for diabetes, asthma, hypertension, and identifies the exact closest relief camp to your home coordinates.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleInstallDefaultGuides}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0B3D6E] hover:bg-[#07284B] text-white px-5 py-2.5 rounded-md font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Default NDMA Guides Now</span>
                </button>

                <Link
                  href="/citizen/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-5 py-2.5 rounded-md font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  <span>Pre-Register Household</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>
          )}

          {/* Guide Content Display */}
          {hasContent && (
            <div className="space-y-6">
              {/* SECTION 1: EMERGENCY FIRST-AID PROTOCOL */}
              {(activeTab === 'all' || activeTab === 'first-aid') && filteredFirstAid && (
                <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
                  <div className="bg-red-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <HeartPulse className="w-5 h-5 text-red-200" />
                      <div>
                        <h2 className="font-bold text-sm sm:text-base">
                          {filteredFirstAid.title}
                        </h2>
                        <span className="text-[11px] text-red-100">NDMA Standard Field Trauma & Bleeding Protocol</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-red-900/60 px-2 py-0.5 rounded text-red-100 font-mono font-bold">
                      PRIORITY 1
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-r text-xs text-red-950 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Life-Threatening Warning:</span> If arterial pulsing blood or unconsciousness is observed, initiate immediate direct pressure and dispatch 112 / 108 via SMS or voice immediately.
                      </div>
                    </div>

                    <ol className="space-y-3">
                      {filteredFirstAid.steps.map((step, idx) => {
                        const stepKey = `first-aid-${idx}`;
                        return (
                          <li
                            key={stepKey}
                            className="flex items-start justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-md border border-slate-200 text-xs sm:text-sm text-slate-800 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyStep(step, stepKey)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors flex-shrink-0"
                              title="Copy step to clipboard"
                            >
                              {copiedKey === stepKey ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              )}

              {/* SECTION 2: FLOOD EVACUATION & HIGH-GROUND PROTOCOL */}
              {(activeTab === 'all' || activeTab === 'flood') && filteredFlood && (
                <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                  <div className="bg-[#0B3D6E] text-white px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Waves className="w-5 h-5 text-blue-300" />
                      <div>
                        <h2 className="font-bold text-sm sm:text-base">
                          {filteredFlood.title}
                        </h2>
                        <span className="text-[11px] text-blue-200">NDMA High-Ground Routing & Rapid Evacuation Protocol</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-blue-900 px-2 py-0.5 rounded text-blue-100 font-mono font-bold">
                      FLOOD SAFETY
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r text-xs text-blue-950 flex items-start gap-2">
                      <Compass className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Aerial Signal Rule:</span> 3 Short, 3 Long, 3 Short flashlight or reflective mirror flashes signals SOS to rescue helicopters and drones.
                      </div>
                    </div>

                    <ol className="space-y-3">
                      {filteredFlood.steps.map((step, idx) => {
                        const stepKey = `flood-${idx}`;
                        return (
                          <li
                            key={stepKey}
                            className="flex items-start justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-md border border-slate-200 text-xs sm:text-sm text-slate-800 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#0B3D6E] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyStep(step, stepKey)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors flex-shrink-0"
                              title="Copy step to clipboard"
                            >
                              {copiedKey === stepKey ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              )}

              {/* SECTION 3: LOCAL RELIEF SHELTERS */}
              {(activeTab === 'all' || activeTab === 'shelters') && filteredShelters.length > 0 && (
                <div className="bg-white rounded-lg border border-emerald-200 shadow-sm overflow-hidden">
                  <div className="bg-emerald-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-5 h-5 text-emerald-300" />
                      <div>
                        <h2 className="font-bold text-sm sm:text-base">
                          Pre-Identified Local Relief Camps & Shelters
                        </h2>
                        <span className="text-[11px] text-emerald-100">Offline Geographic Coordinates & Cardinal Bearing</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-200 font-mono font-bold">
                      {filteredShelters.length} SHELTERS CACHED
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredShelters.map((shelter: LocalShelterGuide, idx: number) => (
                      <div
                        key={`shelter-${idx}`}
                        className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-colors flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {shelter.name}
                            </h3>
                            <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-bold font-mono whitespace-nowrap">
                              {shelter.distance} • {shelter.cardinal}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                            <Compass className="w-3 h-3 text-emerald-700" />
                            <span>Lat: {shelter.lat.toFixed(4)}, Lng: {shelter.lng.toFixed(4)}</span>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                          <span className="text-emerald-800 font-medium">NDMA High-Ground Site</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${shelter.lat},${shelter.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0B3D6E] hover:underline font-semibold"
                          >
                            <span>Open Map</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: DISEASE-SPECIFIC & MEDICAL PROTOCOLS */}
              {(activeTab === 'all' || activeTab === 'medical') && Object.keys(filteredDiseases).length > 0 && (
                <div className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
                  <div className="bg-purple-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Stethoscope className="w-5 h-5 text-purple-200" />
                      <div>
                        <h2 className="font-bold text-sm sm:text-base">
                          Chronic Disease &amp; Medical Condition Protocols
                        </h2>
                        <span className="text-[11px] text-purple-200">Personalized Medicine Storage & Emergency Triage</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-purple-950 px-2 py-0.5 rounded text-purple-200 font-mono font-bold">
                      SPECIAL CARE
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(filteredDiseases).map(([diseaseKey, item]) => (
                      <div
                        key={diseaseKey}
                        className="p-4 rounded-lg border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-600" />
                            <span>{item.title || diseaseKey}</span>
                          </h3>
                          <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            {diseaseKey}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-3 rounded border border-purple-100">
                          {item.protocol}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* National Helplines Quick Banner */}
          <div className="mt-8 bg-[#07284B] rounded-lg p-4 sm:p-5 text-white border border-blue-900 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-800/80 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#FF9933]">
                <PhoneCall className="w-4 h-4" />
                <span>24x7 Emergency Helplines (Works Even Without Internet)</span>
              </div>
              <span className="text-[11px] text-blue-200">Standard Voice or SMS Dispatches</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-2.5 rounded border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase">All Emergency Services</span>
                <a href="tel:112" className="text-lg font-black text-[#FF9933] hover:underline">112</a>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase">Medical Ambulance</span>
                <a href="tel:108" className="text-lg font-black text-[#FF9933] hover:underline">108</a>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase">NDRF Rescue Helpline</span>
                <a href="tel:1078" className="text-lg font-black text-[#FF9933] hover:underline">1078</a>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase">State Disaster Control</span>
                <a href="tel:1070" className="text-lg font-black text-[#FF9933] hover:underline">1070</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
}
