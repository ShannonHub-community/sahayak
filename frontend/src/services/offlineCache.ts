import type { GuideBundle } from '@/types/registration';

const STORAGE_KEY_OFFLINE_GUIDES = 'sahayak_offline_emergency_guides';

export interface FirstAidGuideContent {
  title: string;
  steps: string[];
}

export const DEFAULT_NDMA_GUIDES: GuideBundle = {
  first_aid_guide: {
    title: 'Emergency First-Aid Protocol (NDMA Standard)',
    steps: [
      'Apply direct, steady pressure on active bleeding wounds using a clean cloth or gauze for at least 10 minutes.',
      'Immobilize suspected bone fractures or dislocations with a rigid splint without attempting to realign.',
      'Wrap hypothermic or shock victims in dry blankets; keep head and core elevated above flood water.',
      'Clear the airway if victim is breathing. Do NOT administer oral fluids to unconscious or semi-conscious persons.',
      'In case of chemical or dirty floodwater eye exposure, flush thoroughly with clean drinking water for 15 minutes.',
    ],
  },
  flood_protocol_guide: {
    title: 'National Flood Evacuation & High-Ground Routing Protocol',
    steps: [
      'Immediately disconnect main electrical MCB switch and shut off LPG cylinder valves before water enters.',
      'Gather 72-hour survival kit: drinking water, high-calorie food, prescription medications, whistle, torch, and photo ID in waterproof bags.',
      'Move elderly, children, and persons with disabilities to upper floors or designate pre-identified high-ground shelters.',
      'Never attempt to wade or drive through flowing water deeper than 15 cm (6 inches) — fast-moving currents easily sweep vehicles away.',
      'Signal NDRF/Coast Guard rescue helicopters or drones with bright colored cloth or emergency flashlight SOS cadence (3 short, 3 long, 3 short).',
    ],
  },
  local_shelters: [
    {
      name: 'District Community & Relief Hall - Sector 4',
      distance: '0.8 km',
      cardinal: 'NE',
      lat: 18.9904,
      lng: 73.1215,
    },
    {
      name: 'Municipal Higher Secondary Relief Camp',
      distance: '1.4 km',
      cardinal: 'NW',
      lat: 18.9862,
      lng: 73.1143,
    },
    {
      name: 'Civil Hospital Emergency Medical Wing & Blood Bank',
      distance: '2.1 km',
      cardinal: 'E',
      lat: 18.9958,
      lng: 73.1328,
    },
    {
      name: 'Pillai Multi-Purpose Relief Transit Center',
      distance: '2.6 km',
      cardinal: 'SE',
      lat: 18.9810,
      lng: 73.1290,
    },
  ],
  disease_specific_guides: {
    'Diabetes': {
      title: 'Diabetes & Insulin Cold-Chain Protocol',
      protocol: 'Store insulin vials in watertight sealed container with ice pack or cold clay pot. Do not skip meals if taking sulfonylureas. Civil Hospital maintains 24x7 generator-backed cold storage.',
    },
    'Hypertension & Cardiac': {
      title: 'Cardiac Medication & Stress Triage Protocol',
      protocol: 'Keep 14-day supply of beta-blockers/ACE-inhibitors in waterproof ziplock. Monitor pulse rate, remain calm, and avoid heavy lifting or strenuous wading during evacuation.',
    },
    'Asthma & Respiratory': {
      title: 'Respiratory Emergency & Inhaler Protocol',
      protocol: 'Keep rescue bronchodilator attached to body with lanyard. Avoid damp moldy basement areas during evacuation, and cover nose and mouth with damp cloth if flood silt dries into dust.',
    },
    'Kidney & Dialysis': {
      title: 'Renal / Dialysis Critical Access Protocol',
      protocol: 'Strictly limit daily fluid intake to 500ml above urine output if scheduled dialysis is delayed. Contact nearest civil hospital relief cell immediately for emergency hemodialysis slot.',
    },
  },
};

export function hasOfflineGuides(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_GUIDES);
    return Boolean(raw && raw.length > 0);
  } catch {
    return false;
  }
}

export function getCachedGuideBundle(): GuideBundle | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_GUIDES);
    if (!raw) return null;
    return JSON.parse(raw) as GuideBundle;
  } catch {
    return null;
  }
}

export async function getCachedGuide(guideKey: string): Promise<FirstAidGuideContent | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_GUIDES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (guideKey === 'first-aid' && parsed.first_aid_guide) {
      return parsed.first_aid_guide;
    }
    return parsed[guideKey] || null;
  } catch {
    return null;
  }
}

export function saveOfflineGuides(guideBundle: GuideBundle | any): void {
  if (typeof window === 'undefined' || !guideBundle) return;
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_GUIDES, JSON.stringify(guideBundle));
    window.dispatchEvent(new CustomEvent('sahayak-offline-cache-updated'));
  } catch (err) {
    console.warn('Unable to cache offline emergency guides:', err);
  }
}

export function loadDefaultNDMAGuides(): GuideBundle {
  saveOfflineGuides(DEFAULT_NDMA_GUIDES);
  return DEFAULT_NDMA_GUIDES;
}

export function clearOfflineGuides(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_OFFLINE_GUIDES);
    window.dispatchEvent(new CustomEvent('sahayak-offline-cache-updated'));
  } catch (err) {
    console.warn('Unable to clear offline guides:', err);
  }
}

const HAZARDS_CACHE_KEY = 'sahayak_offline_hazards';

export function saveHazards(hazards: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HAZARDS_CACHE_KEY, JSON.stringify(hazards || []));
    window.dispatchEvent(new CustomEvent('sahayak-offline-hazards-updated'));
  } catch (err) {
    console.warn('Unable to cache offline hazards:', err);
  }
}

export function getOfflineHazards(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HAZARDS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
