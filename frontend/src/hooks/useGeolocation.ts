import { useState, useCallback } from 'react';
import type { SOSLocation } from '@/types/sos';
import {
  getRealCoordinates,
  getRobustCoordinates,
  getCurrentCoordinates,
  type GeoCoordinates,
  type GeolocationOptions,
} from '@/services/geolocation';

export { getRealCoordinates, getRobustCoordinates, getCurrentCoordinates };
export type { GeolocationOptions };
export type GeolocationResult = GeoCoordinates;

export interface GeolocationState {
  location: SOSLocation | null;
  isAcquiring: boolean;
  error: string | null;
}

/**
 * Shared React hook for managing live GPS state across SOS, Registration, and Citizen Maps.
 * Delegates to single authoritative getRealCoordinates service.
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
        const coords = await getRealCoordinates();
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
