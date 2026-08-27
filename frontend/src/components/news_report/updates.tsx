import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Radio, 
  RefreshCw, 
  WifiOff, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { AlertCard } from '@/components/AlertCard';
import { usePublicAlerts } from '@/services/alerts';
import type { AlertSeverity } from '@/types/alerts';

export default function UpdatesPage() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // SWR Hook for resilient caching and revalidation
  const { alerts, isLoading, isValidating, isOfflineCached, error, refresh } = usePublicAlerts();

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
    // Only allow pull-to-refresh when scrolled to top
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
      // Dampen the pull distance (max 80px)
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
  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity === 'all') return true;
    return alert.severity === selectedSeverity;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const infoCount = alerts.filter((a) => a.severity === 'info').length;

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
        {/* Page Identity & Refresh Bar */}
        <div className="bg-white border border-gray-300 rounded-md p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
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

            {/* Primary Pull-to-Refresh / Reload Action Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isValidating}
              className="bg-white hover:bg-gray-50 active:bg-gray-100 text-[#0B3D6E] border-2 border-[#0B3D6E] text-xs font-bold px-3 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
              title="Reload alerts from central disaster server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isValidating ? 'animate-spin' : ''}`} />
              <span>{isRefreshing || isValidating ? 'Updating...' : 'Pull to Refresh'}</span>
            </button>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Read-only authoritative alerts published by NDMA, IMD, Central Water Commission, and State Disaster Management Authorities. <strong>Data is cached automatically on this device</strong> and remains readable during cellular network blackouts.
          </p>

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

          {/* Quick Severity Filter Chips (Mobile-friendly triage) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">
              Filter:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors ${
                selectedSeverity === 'all'
                  ? 'bg-[#0B3D6E] text-white border-[#0B3D6E]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Alerts ({alerts.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity('critical')}
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
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
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
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
              className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
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

          {/* Filtered Alerts List */}
          {!isLoading && filteredAlerts.length > 0 && (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {/* Empty Filter State */}
          {!isLoading && filteredAlerts.length === 0 && alerts.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-md p-8 text-center text-gray-500 space-y-2">
              <Info className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs font-medium">
                No alerts found matching the &quot;{selectedSeverity}&quot; severity category.
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
            Showing latest 20 official bulletins ordered newest-first.
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
