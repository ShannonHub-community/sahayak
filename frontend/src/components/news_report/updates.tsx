'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { 
  Radio, 
  RefreshCw, 
  WifiOff, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Globe,
  MapPin,
  X,
  Loader2
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { AlertCard } from '@/components/AlertCard';
import { usePublicAlerts } from '@/services/alerts';
import { getCurrentCoordinates } from '@/services/geolocation';
import { getStateFromCoordinates } from '@/services/location';
import { 
  SUPPORTED_LANGUAGES, 
  type LanguageCode 
} from '@/types/translation';
import { 
  getSavedLanguage, 
  saveLanguage, 
  translateAlerts, 
  type TranslatedAlertsMap 
} from '@/services/translation';
import type { AlertSeverity, PublicAlert } from '@/types/alerts';

// Storage key for persisting feed mode preference ('nationwide' | 'regional')
const LOCATION_FEED_MODE_KEY = 'sahayak_alerts_feed_mode';

export default function UpdatesPage() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  // Filter & Location States
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  // Translation States
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => {
    return getSavedLanguage() || 'en';
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedMap, setTranslatedMap] = useState<TranslatedAlertsMap>({});

  // Refresh & Touch drag states
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // SWR Hook with optional stateFilter and resilient caching
  const { alerts, isLoading, isValidating, isOfflineCached, error, refresh } = usePublicAlerts(
    1,
    selectedState
  );

  // 1. Auto-detect GPS state on mount
  useEffect(() => {
    // Auto-detect GPS coordinates and resolve Indian State
    async function autoDetectLocation() {
      setIsDetectingLocation(true);
      setLocationNote(null);
      try {
        const coords = await getCurrentCoordinates();
        const res = await getStateFromCoordinates(coords.lat, coords.lng);
        if (res && res.state) {
          setDetectedState(res.state);
          const savedMode = typeof window !== 'undefined' ? localStorage.getItem(LOCATION_FEED_MODE_KEY) : null;
          // Only auto-scope to detected state if user has NOT explicitly chosen nationwide feed
          if (savedMode !== 'nationwide') {
            setSelectedState(res.state);
          }
        } else {
          setLocationNote('Showing nationwide feed — enable location to see alerts for your state.');
        }
      } catch (err: unknown) {
        console.warn('GPS state detection unavailable:', err);
        setLocationNote('Showing nationwide feed — enable location to see alerts for your state.');
      } finally {
        setIsDetectingLocation(false);
      }
    }

    autoDetectLocation();
  }, []);

  // Handlers for switching between Nationwide feed and Regional state-filtered feed
  const handleViewNationwide = () => {
    console.log('[DEBUG handleViewNationwide] BEFORE click, selectedState was:', selectedState);
    setSelectedState(null);
    console.log('[DEBUG handleViewNationwide] AFTER click handled, setSelectedState(null) called. New intended state: null');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCATION_FEED_MODE_KEY, 'nationwide');
      } catch (e) {
        console.warn('Unable to persist feed mode:', e);
      }
    }
  };

  const handleFilterToDetectedState = () => {
    if (detectedState) {
      setSelectedState(detectedState);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCATION_FEED_MODE_KEY, 'regional');
        } catch (e) {
          console.warn('Unable to persist feed mode:', e);
        }
      }
    }
  };

  useEffect(() => {
    console.log('[DEBUG Component State] Current selectedState in updates.tsx:', selectedState);
  }, [selectedState]);

  // Keep ref to alerts so async translation always accesses latest data without depending on unstable array references
  const alertsRef = useRef(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  // Stable primitive fingerprint of alerts based on IDs and titles
  const alertsFingerprint = useMemo(
    () => alerts.map((a) => `${a.id}:${a.title}`).join('|'),
    [alerts]
  );

  // Track last completed or in-flight translation key (lang + fingerprint) to prevent redundant runs
  const lastTranslatedKeyRef = useRef<string>('');

  // 2. Wrapped translation handler with minimal, stable dependencies
  const handleTranslation = useCallback(async (targetLanguage: LanguageCode, alertsToTranslate: PublicAlert[]) => {
    if (targetLanguage === 'en') {
      setTranslatedMap((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      setIsTranslating(false);
      lastTranslatedKeyRef.current = 'en:';
      return;
    }

    if (!alertsToTranslate || alertsToTranslate.length === 0) {
      return;
    }

    const currentFingerprint = alertsToTranslate.map((a) => `${a.id}:${a.title}`).join('|');
    const translationKey = `${targetLanguage}:${currentFingerprint}`;

    if (lastTranslatedKeyRef.current === translationKey) {
      return; // Already translated for this exact language and alerts dataset
    }

    lastTranslatedKeyRef.current = translationKey;
    setIsTranslating(true);

    try {
      const result = await translateAlerts(alertsToTranslate, targetLanguage);
      if (lastTranslatedKeyRef.current === translationKey) {
        setTranslatedMap(result);
      }
    } catch (err) {
      console.warn('Translation failed, falling back to original text:', err);
      if (lastTranslatedKeyRef.current === translationKey) {
        setTranslatedMap({});
      }
    } finally {
      if (lastTranslatedKeyRef.current === translationKey) {
        setIsTranslating(false);
      }
    }
  }, []);

  // 3. Trigger translation when language changes or alerts content changes (guarded by stable fingerprint)
  useEffect(() => {
    if (selectedLanguage === 'en' || !alertsFingerprint) {
      return;
    }

    handleTranslation(selectedLanguage, alertsRef.current);
  }, [selectedLanguage, alertsFingerprint, handleTranslation]);

  // Language selector change handler
  const handleLanguageChange = (code: LanguageCode) => {
    setSelectedLanguage(code);
    saveLanguage(code);
    if (code === 'en') {
      setTranslatedMap({});
      setIsTranslating(false);
      lastTranslatedKeyRef.current = 'en:';
    } else {
      handleTranslation(code, alertsRef.current);
    }
  };

  // Manual & Pull-to-refresh handler
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    }
  }, [refresh]);

  // Touch-based pull-to-refresh for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window === 'undefined') return;
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || typeof window === 'undefined') return;
    if (window.scrollY > 5) {
      isDragging.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      const damped = Math.min(diff * 0.45, 80);
      setPullDistance(damped);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (pullDistance > 55) {
      handleManualRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Filter alerts by selected severity
  const filteredAlerts = alerts.filter((alert: PublicAlert) => {
    if (selectedSeverity === 'all') return true;
    return alert.severity === selectedSeverity;
  });

  const criticalCount = alerts.filter((a: PublicAlert) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a: PublicAlert) => a.severity === 'warning').length;
  const infoCount = alerts.filter((a: PublicAlert) => a.severity === 'info').length;

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F4F6F8]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Head>
        <title>Live Updates & Public Alerts | Sahayak Citizen Portal</title>
        <meta
          name="description"
          content="Official real-time disaster alerts, dam discharge notices, and evacuation advisories from the National Disaster Management Grid."
        />
      </Head>

      {/* Official Government Header */}
      <GovHeader onSkipToContent={() => mainContentRef.current?.focus()} />

      {/* Visual Pull-to-Refresh Indicator on Mobile */}
      {pullDistance > 0 && (
        <div
          className="fixed top-24 left-0 right-0 z-40 flex items-center justify-center transition-transform"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          <div className="bg-white border-2 border-[#0B3D6E] text-[#0B3D6E] px-4 py-2 rounded-full shadow-md text-xs font-bold flex items-center gap-2">
            <RefreshCw
              className={`w-4 h-4 ${pullDistance > 55 || isRefreshing ? 'animate-spin text-red-600' : ''}`}
            />
            <span>
              {pullDistance > 55 ? 'Release to reload feed' : 'Pull down to refresh alerts'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col outline-none space-y-4"
      >
        {/* Page Identity & Controls Bar */}
        <div className="bg-white border border-gray-300 rounded-md p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-50 text-red-600 rounded-md border border-red-200">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#FF9933] text-black font-bold uppercase px-1.5 py-0.2 rounded-xs">
                    OFFICIAL BROADCAST
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    NATIONAL DISASTER GRID
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-extrabold text-[#0B3D6E] tracking-tight mt-0.5">
                  Live Public Alerts & Evacuation Advisories
                </h1>
              </div>
            </div>

            {/* Right Controls: 11-Language Dropdown + Refresh Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 11-Language Selector Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-md text-xs">
                <Globe className="w-3.5 h-3.5 text-[#0B3D6E] flex-shrink-0" />
                <label htmlFor="language-select" className="sr-only">
                  Select Language
                </label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                  className="bg-transparent font-bold text-[#0B3D6E] text-xs outline-none cursor-pointer pr-1"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                {/* Inline Translation Loading Indicator */}
                {isTranslating && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 animate-pulse font-semibold ml-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">Translating...</span>
                  </span>
                )}
              </div>

              {/* Primary Pull-to-Refresh / Reload Action Button */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isValidating}
                className="bg-white hover:bg-gray-50 active:bg-gray-100 text-[#0B3D6E] border-2 border-[#0B3D6E] text-xs font-bold px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                title="Reload alerts from central disaster server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isValidating ? 'animate-spin' : ''}`} />
                <span>{isRefreshing || isValidating ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Read-only authoritative alerts published by NDMA, IMD, Central Water Commission, and State Disaster Management Authorities. <strong>Data is cached automatically on this device</strong> and remains readable during cellular network blackouts.
          </p>

          {/* Location / State Filtering Banner */}
          {isDetectingLocation ? (
            <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-md text-xs text-blue-900 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B3D6E]" />
              <span>Detecting your location via GPS to display relevant regional advisories...</span>
            </div>
          ) : selectedState && !bannerDismissed ? (
            <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-md text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  Showing alerts for <strong>{selectedState}</strong> (based on GPS location).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewNationwide}
                  className="text-[11px] font-bold text-emerald-900 underline hover:text-emerald-700 cursor-pointer"
                >
                  View Nationwide Feed
                </button>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss location banner"
                  className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : !selectedState && detectedState ? (
            <div className="bg-slate-50 border border-slate-300 p-2.5 rounded-md text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Showing unfiltered nationwide alerts.</span>
              </div>
              <button
                type="button"
                onClick={handleFilterToDetectedState}
                className="text-[11px] font-bold text-[#0B3D6E] underline hover:text-blue-900 cursor-pointer"
              >
                Filter to {detectedState} (Show my region again)
              </button>
            </div>
          ) : locationNote && !bannerDismissed ? (
            <div className="bg-amber-50 border border-amber-200 p-2 rounded-md text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span>{locationNote}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss note"
                className="text-amber-700 hover:text-amber-900 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Offline / Cached Notice Banner */}
          {isOfflineCached && (
            <div className="bg-amber-50 border-l-4 border-amber-600 p-3 rounded-r-md text-xs text-amber-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  <strong>Offline Mode Active:</strong> Displaying last cached public alerts stored on this device. New bulletins will sync automatically when connectivity resumes.
                </span>
              </div>
              <span className="text-[10px] font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 flex-shrink-0">
                CACHED
              </span>
            </div>
          )}

          {/* Quick Severity Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">
              Severity:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                selectedSeverity === 'all'
                  ? 'bg-[#0B3D6E] text-white border-[#0B3D6E]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({alerts.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity('critical')}
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'critical'
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Critical ({criticalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity('warning')}
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'warning'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Warning ({warningCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity('info')}
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'info'
                  ? 'bg-blue-700 text-white border-blue-800'
                  : 'bg-white text-[#0B3D6E] border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Info className="w-3 h-3" />
              <span>Advisories ({infoCount})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Feed Area (Newest at the Top) */}
        <section aria-label="Official Disaster Alerts Feed" className="space-y-3">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-gray-200 rounded-md p-4 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-12 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && alerts.length === 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-md p-6 text-center space-y-3">
              <AlertOctagon className="w-8 h-8 text-red-600 mx-auto" />
              <div className="font-bold text-red-900 text-sm">
                Unable to Connect to Central Disaster Alert Feed
              </div>
              <p className="text-xs text-red-800 max-w-md mx-auto">
                No local cache was found. Please verify your connection or pull to retry.
              </p>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="bg-[#0B3D6E] text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Filtered Alerts List with Per-Card Audio & Translation */}
          {!isLoading && filteredAlerts.length > 0 && (
            <div className="space-y-3">
              {filteredAlerts.map((alert: PublicAlert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  translatedTitle={translatedMap[alert.id]?.title}
                  translatedMessage={translatedMap[alert.id]?.message}
                  activeLanguage={selectedLanguage}
                />
              ))}
            </div>
          )}

          {/* Empty Filter State */}
          {!isLoading && filteredAlerts.length === 0 && alerts.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-md p-8 text-center text-gray-500 space-y-2">
              <Info className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs font-medium">
                No alerts found matching the &quot;{selectedSeverity}&quot; severity category
                {selectedState ? ` in ${selectedState}` : ''}.
              </p>
              <button
                type="button"
                onClick={() => setSelectedSeverity('all')}
                className="text-xs font-bold text-[#0B3D6E] underline cursor-pointer"
              >
                Show All Alerts
              </button>
            </div>
          )}
        </section>

        {/* Bottom Helper Bar */}
        <div className="p-3 bg-gray-100 border border-gray-300 rounded-md text-center text-[11px] text-gray-600 flex flex-wrap items-center justify-between gap-2">
          <span>
            Showing official bulletins ordered newest-first.
            {selectedState ? ` Region: ${selectedState}` : ' Region: Nationwide'}
          </span>
          <span className="font-mono text-gray-500">
            Feed Protocol: SWR-Offline-v1
          </span>
        </div>
      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
}
