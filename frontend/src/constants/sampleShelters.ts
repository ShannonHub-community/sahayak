import type { NearestShelter } from '@/types/sos';

export interface SampleShelterItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacityPax: number;
  category: string;
  contact?: string;
}

export const PANVEL_SAMPLE_SHELTERS: SampleShelterItem[] = [
  {
    id: 'SH-PNV-001',
    name: 'Pillai College of Engineering Emergency Shelter',
    lat: 18.9902,
    lng: 73.1276,
    capacityPax: 1500,
    category: 'High-Ground Multi-Story Academic Campus',
    contact: '+91 22 2745 6030',
  },
  {
    id: 'SH-PNV-002',
    name: 'Panvel Railway Station Relief Camp',
    lat: 18.9894,
    lng: 73.1215,
    capacityPax: 1000,
    category: 'Central Transit Relief Hub & Staging Area',
    contact: '+91 22 2745 2233',
  },
  {
    id: 'SH-PNV-003',
    name: 'Gandhi Hospital Emergency Medical Shelter',
    lat: 18.9925,
    lng: 73.1165,
    capacityPax: 750,
    category: '24x7 Emergency Trauma & Triage Facility',
    contact: '+91 22 2745 4488',
  },
  {
    id: 'SH-PNV-004',
    name: 'CKT College High-Ground Relief Camp',
    lat: 18.9930,
    lng: 73.1240,
    capacityPax: 1200,
    category: 'Covered High-Ground Relief Base',
    contact: '+91 22 2748 1122',
  },
  {
    id: 'SH-PNV-005',
    name: 'Municipal High School Relief Camp (Old Panvel)',
    lat: 18.9856,
    lng: 73.1189,
    capacityPax: 850,
    category: 'Designated Municipal Relief Shelter',
    contact: '+91 22 2745 2233',
  },
  {
    id: 'SH-PNV-006',
    name: 'MGM Hospital & Medical Trauma Annex (Kamothe)',
    lat: 19.0182,
    lng: 73.0934,
    capacityPax: 600,
    category: 'Medical Triage & Critical Care Hub',
    contact: '+91 22 2743 7900',
  },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (Math.round((theta * 180) / Math.PI) + 360) % 360;
}

function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export function findNearestPanvelShelter(lat: number, lng: number): NearestShelter {
  let minDistance = Infinity;
  let nearestItem: SampleShelterItem = PANVEL_SAMPLE_SHELTERS[0];

  for (const shelter of PANVEL_SAMPLE_SHELTERS) {
    const dist = calculateDistanceKm(lat, lng, shelter.lat, shelter.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestItem = shelter;
    }
  }

  const bearing = calculateBearingDeg(lat, lng, nearestItem.lat, nearestItem.lng);
  const cardinal = getCardinalDirection(bearing);
  const distanceStr =
    minDistance < 1
      ? `${Math.round(minDistance * 1000)} m`
      : `${minDistance.toFixed(1)} km`;

  return {
    name: nearestItem.name,
    distance: distanceStr,
    cardinal,
    bearing,
    coordinates: {
      lat: nearestItem.lat,
      lng: nearestItem.lng,
    },
    capacityPax: nearestItem.capacityPax,
    category: nearestItem.category,
  };
}
