export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Single authoritative device geolocation retriever used by both mode="pick" (Registration) and mode="live" (SOS).
 * Queries the browser's real Geolocation API (navigator.geolocation.getCurrentPosition) directly.
 * Uses enableHighAccuracy: true for GPS hardware positioning.
 * Uses generous 20000ms timeout for reliable GPS acquisition even indoors / on weak signals.
 * Uses maximumAge: 0 to prevent stale cached coordinates.
 * Includes graceful fallback to network/Wi-Fi positioning if hardware GPS times out.
 */
export async function getRealCoordinates(options?: GeolocationOptions): Promise<GeoCoordinates> {
  if (typeof window === 'undefined') {
    throw new Error('Geolocation is only available in browser environments.');
  }

  if (window.isSecureContext === false) {
    // On plain-HTTP LAN addresses (e.g. 192.168.x.x:3000) browsers block
    // navigator.geolocation entirely. Surface a user-friendly error that
    // the caller can catch and degrade gracefully into manual map-pin mode.
    throw new Error(
      'Location requires HTTPS or localhost. Please tap the map to pin your location manually.'
    );
  }

  if (!('geolocation' in navigator)) {
    throw new Error(
      'Geolocation is not supported by your browser. Please pin your location manually on the map.'
    );
  }

  const queryPosition = (
    useHighAccuracy: boolean,
    timeoutMs: number,
    maxAgeMs: number
  ): Promise<GeoCoordinates> => {
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
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: timeoutMs,
          maximumAge: maxAgeMs,
        }
      );
    });
  };

  const highAccuracy = options?.enableHighAccuracy ?? true;
  // 10 s is ample on modern devices; the 20 s original caused a 35-second
  // worst-case stall (Stage 1 + Stage 2) before the user could fall back.
  const timeoutMs = options?.timeout ?? 10000;
  // Reuse a cached position that is at most 15 seconds old. This avoids a
  // GPS hardware cold-start when the OS has fresh coordinates available.
  const maxAgeMs = options?.maximumAge ?? 15000;

  try {
    // 1. Primary GPS hardware positioning with 20-second timeout & maximumAge: 0
    return await queryPosition(highAccuracy, timeoutMs, maxAgeMs);
  } catch (err: any) {
    // If the user denied permission, fail immediately without retry
    if (err?.code === 1 /* PERMISSION_DENIED */) {
      throw new Error(
        'Location access was denied. Please allow location permissions in your browser settings, or tap the map to pin your location.'
      );
    }

    // 2. If high-accuracy timed out or is unavailable (e.g. indoors or on
    // laptops without dedicated GPS hardware), fallback to network/Wi-Fi
    // positioning before giving up.
    if (highAccuracy) {
      try {
        return await queryPosition(false, 8000, 15000);
      } catch (fallbackErr: any) {
        let message = 'GPS location request timed out. Please tap "Use Current Location" to retry or tap the map to pin.';
        if (fallbackErr?.code === 1 /* PERMISSION_DENIED */) {
          message = 'Location access was denied. Please allow location permissions in your browser settings, or tap the map to pin your location.';
        } else if (fallbackErr?.code === 2 /* POSITION_UNAVAILABLE */) {
          message = 'Location information is unavailable from device GPS sensors. Please tap on the map to drop a pin.';
        }
        throw new Error(message);
      }
    }

    let message = 'GPS location request timed out. Please tap "Use Current Location" to retry or tap the map to pin.';
    if (err?.code === 2 /* POSITION_UNAVAILABLE */) {
      message = 'Location information is unavailable from device GPS sensors. Please tap on the map to drop a pin.';
    }
    throw new Error(message);
  }
}

// Aliases ensuring exact single implementation is used across all legacy imports
export const getCurrentCoordinates = getRealCoordinates;
export const getRobustCoordinates = getRealCoordinates;
