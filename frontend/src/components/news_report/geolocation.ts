/**
 * Shared browser Geolocation helper for Sahayak Citizen Portal
 * Acquires high-accuracy GPS coordinates with timeout & fallback handling
 */

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

export async function getCurrentCoordinates(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
): Promise<GeoCoordinates> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation API not supported on this device');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(err);
      },
      options
    );
  });
}
