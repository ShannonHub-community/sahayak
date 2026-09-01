import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Compass,
  X,
  Check,
  ChevronDown,
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
  type LanguageCode, 
  type LanguageOption 
} from '@/types/translation';
import { 
  getSavedLanguage, 
  saveLanguage, 
  translateAlerts, 
  type TranslatedAlertsMap 
} from '@/services/translation';
import type { AlertSeverity } from '@/types/alerts';

export default function UpdatesPage() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  // Filter States
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [detectedStateName, setDetectedStateName] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showLocationBanner, setShowLocationBanner] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Translation States
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedMap, setTranslatedMap] = useState<TranslatedAlertsMap>({});

  // Refresh & Touch drag states
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // SWR Hook with state-aware caching
  const { alerts, isLoading, isValidating, isOfflineCached, error, refresh } = usePublicAlerts(
    1,
    selectedState
  );

  // 1. Initialize Saved Language & Detect GPS Location on mount
  useEffect(() => {
    // Load persisted language
    const savedLang = getSavedLanguage();
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }

    // Auto-detect GPS location & state
    async function autoDetectLocation() {
      setIsLocating(true);
      setLocationError(null);
      try {
        const coords = await getCurrentCoordinates();
        const stateRes = await getStateFromCoordinates(coords.lat, coords.lng);
        if (stateRes.state) {
          setDetectedStateName(stateRes.state);
          setSelectedState(stateRes.state);
        }
      } catch (err: any) {
        console.warn('GPS state detection unavailable:', err);
        setLocationError('Enable location to see alerts for your area — showing all updates for now.');
      } finally {
        setIsLocating(false);
      }
    }

    autoDetectLocation();
  }, []);

  // 2. Perform translation when alerts change or when language changes
  useEffect(() => {
    let isCurrent = true;

    async function handleTranslation() {
      if (selectedLanguage === 'en' || alerts.length === 0) {
        setTranslatedMap({});
        return;
      }

      setIsTranslating(true);
      try {
        const res = await translateAlerts(alerts, selectedLanguage);
        if (isCurrent) {
          setTranslatedMap(res);
        }
      } catch (err) {
        console.warn('Translation failed:', err);
      } finally {
        if (isCurrent) {
          setIsTranslating(false);
        }
      }
    }

    handleTranslation();

    return () => {
      isCurrent = false;
    };
  }, [alerts, selectedLanguage]);

  // Handle changing language
  const handleSelectLanguage = (lang: LanguageCode) => {
    setSelectedLanguage(lang);
    saveLanguage(lang);
    setIsLangMenuOpen(false);
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

  // Severity counts
  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity === 'all') return true;
    return alert.severity === selectedSeverity;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const infoCount = alerts.filter((a) => a.severity === 'info').length;

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

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
          content="Official real-time disaster alerts, dam discharge notices, and evacuation advisories with multilingual translation and text-to-speech support."
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
        className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col outline-none space-y-3 sm:space-y-4"
      >
        {/* =========================================================================
            TOP CONTROL BAR: Language Selector & Location Filter Status
           ========================================================================= */}
        <div className="bg-white border border-gray-300 rounded-md p-4 sm:p-5 shadow-xs space-y-3">
          {/* Header Row: Title + Language Toggle + Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-50 text-red-600 rounded-md border border-red-200 flex-shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#FF9933] text-black font-bold uppercase px-1.5 py-0.2 rounded-xs">
                    OFFICIAL BROADCAST
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono hidden xs:inline-block">
                    NATIONAL DISASTER GRID
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-extrabold text-[#0B3D6E] tracking-tight mt-0.5">
                  Live Public Alerts & Advisories
                </h1>
              </div>
            </div>

            {/* Top Action Buttons: Language Selector + Refresh */}
            <div className="flex items-center gap-2 relative">
              {/* 1. Multilingual Translation Selector Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  aria-expanded={isLangMenuOpen}
                  aria-haspopup="true"
                  className="bg-blue-50/80 hover:bg-blue-100 text-[#0B3D6E] border border-blue-300 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Translate alerts into your preferred Indian language"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0B3D6E]" />
                  <span>{currentLangObj.nativeName}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Dropdown Menu of 11 Supported Indian Languages */}
                {isLangMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsLangMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border-2 border-[#0B3D6E] rounded-md shadow-xl z-50 py-1 text-xs max-h-72 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                        Select Language / भाषा चुनें
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = lang.code === selectedLanguage;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 transition-colors ${
                              isSelected ? 'bg-blue-50 font-bold text-[#0B3D6E]' : 'text-gray-800'
                            }`}
                          >
                            <div>
                              <div>{lang.nativeName}</div>
                              <div className="text-[10px] text-gray-500 font-normal">{lang.name}</div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#0B3D6E]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* 2. Pull / Tap to Refresh */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isValidating}
                className="bg-white hover:bg-gray-50 active:bg-gray-100 text-[#0B3D6E] border border-gray-300 text-xs font-bold px-3 py-1.5 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
                title="Reload alerts from central disaster server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isValidating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing || isValidating ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Location-Based Filter Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0B3D6E]" />
                <span>Region Filter:</span>
              </span>

              {isLocating ? (
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Detecting state via GPS...</span>
                </span>
              ) : selectedState ? (
                <div className="flex items-center gap-1">
                  <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                    📍 {selectedState} (+ National)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedState(null)}
                    className="text-[11px] text-[#0B3D6E] font-bold underline hover:text-blue-900 ml-1"
                  >
                    Show All (Nationwide)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 rounded text-[11px]">
                    All India (Nationwide Scope)
                  </span>
                  {detectedStateName && (
                    <button
                      type="button"
                      onClick={() => setSelectedState(detectedStateName)}
                      className="text-[11px] text-[#0B3D6E] font-bold underline hover:text-blue-900 ml-1"
                    >
                      Filter to {detectedStateName}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Translation Active Tag */}
            {selectedLanguage !== 'en' && (
              <span className="text-[11px] font-semibold text-[#0B3D6E] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Translated to {currentLangObj.name}</span>
              </span>
            )}
          </div>

          {/* Translation In-Progress Notice */}
          {isTranslating && (
            <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded text-xs text-[#0B3D6E] flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B3D6E]" />
              <span>
                Translating alert text into <strong>{currentLangObj.name} ({currentLangObj.nativeName})</strong> via Sarvam Translation Grid...
              </span>
            </div>
          )}

          {/* Location Dismissible Fallback Notice */}
          {locationError && showLocationBanner && !selectedState && (
            <div className="bg-slate-100 border border-slate-300 p-2.5 rounded text-xs text-slate-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>{locationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationBanner(false)}
                className="text-slate-500 hover:text-slate-800 p-1"
                aria-label="Dismiss location note"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Offline / Cached Notice Banner */}
          {isOfflineCached && (
            <div className="bg-amber-50 border-l-4 border-amber-600 p-3 rounded-r-md text-xs text-amber-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  <strong>Offline Mode Active:</strong> Displaying last cached public alerts stored on this device.
                </span>
              </div>
              <span className="text-[10px] font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 flex-shrink-0">
                CACHED
              </span>
            </div>
          )}

          {/* Quick Severity Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">
              Filter:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSeverity('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors ${
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
              className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
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
              className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
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
              className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
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
                className="bg-[#0B3D6E] text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Filtered Alerts List with Translation & Audio Props */}
          {!isLoading && filteredAlerts.length > 0 && (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
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
                No alerts found matching the &quot;{selectedSeverity}&quot; severity category for {selectedState || 'Nationwide'}.
              </p>
              <button
                type="button"
                onClick={() => setSelectedSeverity('all')}
                className="text-xs font-bold text-[#0B3D6E] underline"
              >
                Show All Alerts
              </button>
            </div>
          )}
        </section>

        {/* Bottom Helper Bar */}
        <div className="p-3 bg-gray-100 border border-gray-300 rounded-md text-center text-[11px] text-gray-600 flex flex-wrap items-center justify-between gap-2">
          <span>
            {selectedState ? `Filtered to ${selectedState} + National Grid.` : 'Showing all official nationwide bulletins.'}
          </span>
          <span className="font-mono text-gray-500">
            Feed Protocol: SWR-Geo-v1
          </span>
        </div>
      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
}
