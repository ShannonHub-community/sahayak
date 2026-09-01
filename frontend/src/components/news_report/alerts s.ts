import useSWR, { KeyedMutator } from 'swr';
import type { PublicAlert } from '@/types/alerts';

const STORAGE_CACHE_KEY_PREFIX = 'sahayak_cached_public_alerts_v1';

// Standard fetcher for SWR
export const alertsFetcher = async (url: string): Promise<PublicAlert[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  }
  const data: PublicAlert[] = await res.json();

  // Save successful response to local storage for offline resilience across sessions
  if (typeof window !== 'undefined' && Array.isArray(data) && data.length > 0) {
    try {
      localStorage.setItem(STORAGE_CACHE_KEY_PREFIX, JSON.stringify(data));
    } catch (e) {
      console.warn('Unable to cache alerts in localStorage:', e);
    }
  }

  return data;
};

// Retrieve cached alerts from localStorage if available
export const getCachedAlertsFromStorage = (): PublicAlert[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY_PREFIX);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export interface UsePublicAlertsReturn {
  alerts: PublicAlert[];
  isLoading: boolean;
  isValidating: boolean;
  isOfflineCached: boolean;
  error: Error | undefined;
  refresh: KeyedMutator<PublicAlert[]>;
}

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
      dedupingInterval: 10000, // 10s dedupe
      fallbackData: typeof window !== 'undefined' ? getCachedAlertsFromStorage() : undefined,
    }
  );

  const isOffline = typeof window !== 'undefined' && !navigator.onLine;
  const finalAlerts = data || (typeof window !== 'undefined' ? getCachedAlertsFromStorage() : []);

  return {
    alerts: finalAlerts,
    isLoading: isLoading && finalAlerts.length === 0,
    isValidating,
    isOfflineCached: isOffline || Boolean(error && finalAlerts.length > 0),
    error,
    refresh: mutate,
  };
}
