import { useState, useCallback } from 'react';
import type { SOSLocation } from '@/types/sos';

export interface GeolocationState {
  location: SOSLocation | null;
  isAcquiring: boolean;
  error: string | null;
}

export interface GeolocationResult {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Resilient cross-browser Geolocation retriever.
 * Handles insecure HTTP contexts, desktop Wi-Fi timeout fallbacks,
 * and converts technical error codes into actionable user instructions.
 */
export async function getRobustCoordinates(): Promise<GeolocationResult> {
  if (typeof window === 'undefined') {
    throw new Error('Geolocation is only available in browser environments.');
  }

  // Check Secure Context requirement (HTTPS or localhost)
  if (window.isSecureContext === false) {
    throw new Error(
      'Location access requires a secure HTTPS connection or localhost. Please click on the map to pin your location manually.'
    );
  }

  if (!('geolocation' in navigator)) {
    throw new Error(
      'Geolocation is not supported by your browser. Please click on the map to pin your location manually.'
    );
  }

  // Attempt 1: High accuracy (GPS / cellular)
  const tryHighAccuracy = (): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    });
  };

  // Attempt 2: Standard accuracy (Network / IP fallback for desktop & weak GPS)
  const tryStandardAccuracy = (): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  try {
    return await tryHighAccuracy();
  } catch (err: any) {
    // If permission was explicitly denied, do not retry; fail immediately with instructions
    if (err && err.code === 1) { // PERMISSION_DENIED
      throw new Error(
        'Location access was denied. Please allow location permissions in your browser settings, or click on the map to pin your location.'
      );
    }

    // For timeout (code 3) or position unavailable (code 2), attempt standard accuracy fallback
    try {
      return await tryStandardAccuracy();
    } catch (fallbackErr: any) {
      if (fallbackErr && fallbackErr.code === 1) {
        throw new Error(
          'Location access was denied. Please allow location permissions in your browser settings, or click on the map to pin your location.'
        );
      } else if (fallbackErr && fallbackErr.code === 3) {
        throw new Error(
          'Location request timed out. Please click on the map to pin your location, or tap "Use Current Location" to retry.'
        );
      } else {
        throw new Error(
          'Unable to acquire GPS position. Please tap or click anywhere on the map to set your location.'
        );
      }
    }
  }
}

/**
 * Shared React hook for managing live GPS state across SOS, Registration, and Citizen Maps.
 */
export function useGeolocation(initialLocation: SOSLocation | null = null) {
  const [location, setLocation] = useState<SOSLocation | null>(initialLocation);
  const [isAcquiring, setIsAcquiring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const acquireLocation = useCallback(
    async (
      onSuccess?: (loc: SOSLocation) => void,
      onError?: (errMsg: string) => void
    ) => {
      setIsAcquiring(true);
      setError(null);

      try {
        const coords = await getRobustCoordinates();
        const newLocation: SOSLocation = {
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          isFallback: false,
        };

        setLocation(newLocation);
        setIsAcquiring(false);
        if (onSuccess) onSuccess(newLocation);
        return newLocation;
      } catch (err: any) {
        const message =
          err?.message ||
          'Failed to retrieve GPS location. Please click on the map to drop a pin.';
        setError(message);
        setIsAcquiring(false);
        if (onError) onError(message);
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    location,
    setLocation,
    isAcquiring,
    error,
    setError,
    acquireLocation,
    clearError,
  };
}
