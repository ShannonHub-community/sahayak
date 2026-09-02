'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import type { PublicAlert } from '@/types/alerts';

const STORAGE_CACHE_KEY = 'sahayak_cached_public_alerts_v1';

export const SAMPLE_FALLBACK_ALERTS: PublicAlert[] = [
  {
    id: 'ALT-NDMA-2026-089',
    title: 'Dam Sluice Gate Discharge Advisory — Krishna River Basin',
    message: 'Due to continuous heavy catchment rainfall, 4 spillway gates at Almatti & Narayanpur dams have been opened discharging 1,45,000 cusecs. Residents along low-lying riverbanks must move to designated higher ground shelters immediately.',
    severity: 'critical',
    state: 'Karnataka',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'ALT-IMD-2026-114',
    title: 'Red Alert for Extremely Heavy Downpour — Konkan & Coastal Maharashtra',
    message: 'India Meteorological Department (IMD) issues Red Alert warning of isolated extremely heavy rainfall (>204.4 mm) over Raigad, Thane, and Mumbai MMR over the next 24 hours.',
    severity: 'critical',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'ALT-SDRF-2026-076',
    title: 'Immediate Evacuation Order — Riverside Low-Lying Wards',
    message: 'Local administration has activated mandatory evacuation for riverfront settlements. Municipal transport buses are deployed at Old Bus Stand for safe transit to Municipal High School relief camp.',
    severity: 'warning',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'ALT-DIST-2026-028',
    title: 'Designated Relief Camp Activated at Pillai Engineering College (Panvel)',
    message: 'District Disaster Management Authority has activated relief shelter at Pillai College Campus, New Panvel. Food packets, dry ration, clean drinking water, and emergency medical triage are functional 24x7. Capacity: 1,500 PAX.',
    severity: 'info',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
  },
];

export const getCachedAlertsFromStorage = (): PublicAlert[] => {
  if (typeof window === 'undefined') return SAMPLE_FALLBACK_ALERTS;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return SAMPLE_FALLBACK_ALERTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_FALLBACK_ALERTS;
  } catch {
    return SAMPLE_FALLBACK_ALERTS;
  }
};

export interface UsePublicAlertsReturn {
  alerts: PublicAlert[];
  isLoading: boolean;
  isValidating: boolean;
  isOfflineCached: boolean;
  error: Error | undefined;
  refresh: () => Promise<any>;
}

interface RawAlertItem {
  id?: string | number;
  alert_id?: string | number;
  title: string;
  message: string;
  severity?: string;
  state?: string;
  timestamp?: string;
}

export const alertsFetcher = async (endpoint: string): Promise<PublicAlert[]> => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  let res: Response | null = null;
  try {
    res = await fetch(`${apiBase}${endpoint}`);
  } catch {
    if (!apiBase) {
      res = await fetch(`http://localhost:8000${endpoint}`).catch(() => null);
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Failed to fetch alerts: ${res ? res.statusText : 'Network error'}`);
  }

  const json = await res.json();
  const rawAlerts: RawAlertItem[] = Array.isArray(json) ? json : (json?.alerts || []);

  const formattedAlerts: PublicAlert[] = rawAlerts.map((item: RawAlertItem) => ({
    id: String(item.id || item.alert_id || `ALT-${Date.now()}`),
    title: item.title,
    message: item.message,
    severity: (item.severity === 'critical' || item.severity === 'warning' || item.severity === 'info')
      ? item.severity
      : 'info',
    timestamp: item.timestamp || new Date().toISOString(),
    state: item.state,
  }));

  if (typeof window !== 'undefined' && formattedAlerts.length > 0) {
    try {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(formattedAlerts));
    } catch (e) {
      console.warn('Unable to cache alerts in localStorage:', e);
    }
  }

  return formattedAlerts;
};

/**
 * Custom SWR hook for Live Updates & Alerts Feed
 * Uses SWR caching + revalidation + state filtering + localStorage offline fallback
 */
export function usePublicAlerts(page = 1, stateFilter?: string | null): UsePublicAlertsReturn {
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  if (stateFilter && stateFilter !== 'all') {
    queryParams.set('state', stateFilter);
  }

  const endpointUrl = `/api/comms/public-feed?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<PublicAlert[]>(
    endpointUrl,
    alertsFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      fallbackData: typeof window !== 'undefined' ? getCachedAlertsFromStorage() : SAMPLE_FALLBACK_ALERTS,
    }
  );

  const isOffline = typeof window !== 'undefined' && !navigator.onLine;
  const initialCached = useMemo(() => {
    return typeof window !== 'undefined' ? getCachedAlertsFromStorage() : SAMPLE_FALLBACK_ALERTS;
  }, []);

  const finalAlerts = useMemo(() => {
    const base = data || initialCached;
    if (stateFilter && stateFilter !== 'all' && (!data || isOffline || error)) {
      const filtered = base.filter(
        (a) => !a.state || a.state.toLowerCase() === stateFilter.toLowerCase()
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return base;
  }, [data, initialCached, stateFilter, isOffline, error]);

  return {
    alerts: finalAlerts,
    isLoading: isLoading && !data,
    isValidating,
    isOfflineCached: isOffline || Boolean(error && finalAlerts.length > 0),
    error: error instanceof Error ? error : error ? new Error(String(error)) : undefined,
    refresh: () => mutate(),
  };
}
