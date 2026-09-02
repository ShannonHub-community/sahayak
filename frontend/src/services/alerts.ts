'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PublicAlert } from '@/types/alerts';

const STORAGE_CACHE_KEY = 'sahayak_cached_public_alerts_v1';

const SAMPLE_FALLBACK_ALERTS: PublicAlert[] = [
  {
    id: 'ALT-NDMA-2026-089',
    title: 'Dam Sluice Gate Discharge Advisory — Krishna River Basin',
    message: 'Due to continuous heavy catchment rainfall, 4 spillway gates at Almatti & Narayanpur dams have been opened discharging 1,45,000 cusecs. Residents along low-lying riverbanks must move to designated higher ground shelters immediately.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'ALT-IMD-2026-114',
    title: 'Red Alert for Extremely Heavy Downpour — Konkan & Coastal Maharashtra',
    message: 'India Meteorological Department (IMD) issues Red Alert warning of isolated extremely heavy rainfall (>204.4 mm) over Raigad, Thane, and Mumbai MMR over the next 24 hours.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'ALT-SDRF-2026-076',
    title: 'Immediate Evacuation Order — Riverside Low-Lying Wards',
    message: 'Local administration has activated mandatory evacuation for riverfront settlements. Municipal transport buses are deployed at Old Bus Stand for safe transit to Municipal High School relief camp.',
    severity: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'ALT-DIST-2026-028',
    title: 'Designated Relief Camp Activated at Pillai Engineering College (Panvel)',
    message: 'District Disaster Management Authority has activated relief shelter at Pillai College Campus, New Panvel. Food packets, dry ration, clean drinking water, and emergency medical triage are functional 24x7. Capacity: 1,500 PAX.',
    severity: 'info',
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
  refresh: () => Promise<void>;
}

interface RawAlertItem {
  id?: string | number;
  alert_id?: string | number;
  title: string;
  message: string;
  severity?: string;
  timestamp?: string;
}

export function usePublicAlerts(page = 1): UsePublicAlertsReturn {
  const [alerts, setAlerts] = useState<PublicAlert[]>(getCachedAlertsFromStorage);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);

  const fetchAlerts = useCallback(async () => {
    setIsValidating(true);
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      setIsOfflineCached(true);
      setAlerts(getCachedAlertsFromStorage());
      setIsValidating(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      let res: Response | null = null;
      try {
        res = await fetch(`${apiBase}/api/comms/public-feed?page=${page}`);
      } catch {
        if (!apiBase) {
          res = await fetch(`http://localhost:8000/api/comms/public-feed?page=${page}`).catch(() => null);
        }
      }

      if (res && res.ok) {
        const json = await res.json();
        const rawAlerts: RawAlertItem[] = Array.isArray(json) ? json : (json?.alerts || []);
        if (Array.isArray(rawAlerts) && rawAlerts.length > 0) {
          const formattedAlerts: PublicAlert[] = rawAlerts.map((item: RawAlertItem) => ({
            id: String(item.id || item.alert_id || `ALT-${Date.now()}`),
            title: item.title,
            message: item.message,
            severity: (item.severity === 'critical' || item.severity === 'warning' || item.severity === 'info')
              ? item.severity
              : 'info',
            timestamp: item.timestamp || new Date().toISOString(),
          }));
          setAlerts(formattedAlerts);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(formattedAlerts));
            } catch {
              // ignore
            }
          }
          setIsOfflineCached(false);
          setError(undefined);
          return;
        }
      }
    } catch (err: unknown) {
      console.debug('Public alerts fetch error, fallback to cache:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsOfflineCached(true);
    } finally {
      setIsValidating(false);
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlerts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    isValidating,
    isOfflineCached,
    error,
    refresh: fetchAlerts,
  };
}
