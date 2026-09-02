import { getRobustCoordinates } from '@/hooks/useGeolocation';

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

export async function getCurrentCoordinates(): Promise<GeoCoordinates> {
  return await getRobustCoordinates();
}
