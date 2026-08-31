import type { CitizenProfile } from '@/types/sos';
import { getBrowserIdentifier } from './browserIdentifier';

const STORAGE_KEY_CACHED_PROFILE = 'sahayak_cached_citizen_profile';

/**
 * Looks up registered citizen profile using the persisted browser identifier.
 * Returns null if no browser ID exists, or if unverified / unregistered.
 * Resilient to offline mode by checking local cache.
 */
export async function lookupCitizenProfile(providedBrowserId?: string | null): Promise<CitizenProfile | null> {
  const browserId = providedBrowserId ?? getBrowserIdentifier();
  if (!browserId) {
    return null;
  }

  // 1. If online, attempt API lookup
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isOnline) {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/citizen/lookup?browser_id=${encodeURIComponent(browserId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.citizen_id) {
          // Update cached profile
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_CACHED_PROFILE, JSON.stringify(data));
            } catch {
              // ignore
            }
          }
          return data as CitizenProfile;
        }
      }
    } catch (err) {
      console.debug('Citizen online lookup error, attempting offline cache:', err);
    }
  }

  // 2. Offline / network fallback: retrieve locally cached profile
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHED_PROFILE);
      if (cached) {
        return JSON.parse(cached) as CitizenProfile;
      }
    } catch (err) {
      console.debug('Error reading cached citizen profile:', err);
    }
  }

  return null;
}

