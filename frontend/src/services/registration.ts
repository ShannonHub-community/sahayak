import type { CitizenRegistrationPayload, RegistrationResponse, GuideBundle } from '@/types/registration';
import { setBrowserIdentifier } from './browserIdentifier';
import { saveOfflineGuides } from './offlineCache';

const STORAGE_KEY_CACHED_PROFILE = 'sahayak_cached_citizen_profile';

export function generateSampleGuides(citizenId: string, payload: CitizenRegistrationPayload): GuideBundle {
  const diseaseGuides: Record<string, { title: string; protocol: string }> = {};

  if (payload.long_term_diseases) {
    for (const d of payload.long_term_diseases) {
      if (/diabetes/i.test(d)) {
        diseaseGuides['Diabetes'] = {
          title: 'Diabetes & Insulin Cold-Chain Protocol',
          protocol: 'Store insulin vials in watertight sealed container with cold pack. Do not skip meals if taking sulfonylureas. Civil Hospital Panvel has 24x7 power-backed insulin storage.',
        };
      } else if (/hypertension|cardiac/i.test(d)) {
        diseaseGuides['Hypertension'] = {
          title: 'Cardiac Medication & Stress Triage Protocol',
          protocol: 'Keep 14-day supply of beta-blockers/ACE-inhibitors in waterproof ziplock. Monitor pulse rate and avoid heavy lifting during wading.',
        };
      } else if (/asthma|respiratory/i.test(d)) {
        diseaseGuides['Asthma'] = {
          title: 'Respiratory Emergency & Inhaler Protocol',
          protocol: 'Keep rescue bronchodilator attached to body. Avoid damp moldy basement areas during evacuation.',
        };
      } else if (/renal|dialysis/i.test(d)) {
        diseaseGuides['Renal'] = {
          title: 'Renal / Dialysis Critical Access Protocol',
          protocol: 'Strictly limit daily fluid intake to 500ml above urine output if dialysis is delayed. Panvel MGM Hospital runs emergency hemodialysis.',
        };
      }
    }
  }

  return {
    first_aid_guide: {
      title: 'Emergency First-Aid Protocol (NDMA Standard)',
      steps: [
        'Direct pressure on active bleeding with clean cloth for 10 minutes.',
        'Immobilize suspected fractures with rigid splint.',
        'Keep hypothermic patients warm and elevated above flood water.',
        'Do not give oral fluids to unconscious individuals.',
      ],
    },
    flood_protocol_guide: {
      title: 'Flood Evacuation & High-Ground Routing Protocol',
      steps: [
        'Immediately switch off main electricity MCB and LPG gas cylinder.',
        'Move to top floor with drinking water, medicines, and identification.',
        'Never walk through moving water deeper than knee height.',
        'Signal rescue drones with bright cloth or phone flashlight SOS (3 short, 3 long, 3 short).',
      ],
    },
    local_shelters: [
      {
        name: 'Pillai College of Engineering Emergency Shelter',
        distance: '1.2 km',
        cardinal: 'NE',
        lat: 18.9902,
        lng: 73.1276,
      },
      {
        name: 'Municipal High School Relief Camp',
        distance: '1.8 km',
        cardinal: 'NW',
        lat: 18.9856,
        lng: 73.1189,
      },
    ],
    disease_specific_guides: diseaseGuides,
  };
}

export async function submitRegistration(payload: CitizenRegistrationPayload): Promise<RegistrationResponse> {
  const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const citizenId = `CIT-IND-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;
  const browserIdentifier = `BID-IND-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

  // 1. Persist browser token
  setBrowserIdentifier(browserIdentifier);

  // 2. Generate personalized survival guides and save to device offline storage
  const guideBundle = generateSampleGuides(citizenId, payload);
  saveOfflineGuides(guideBundle);

  // 3. Cache profile JSON in localStorage for instant SOS auto-fill
  if (typeof window !== 'undefined') {
    const profileToCache = {
      citizen_id: citizenId,
      ble_peer_id: `PEER-${citizenId.replace(/[^A-Za-z0-9]/g, '').slice(-8)}`,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      gender: payload.gender,
      age: payload.age,
      blood_group: payload.blood_group,
      medical_conditions: payload.long_term_diseases?.join(', ') || '',
      long_term_diseases: payload.long_term_diseases,
      family_members_count: (payload.family_members?.length || 0) + 1,
      family_members: payload.family_members,
      home_location: payload.home_location,
      work_location: payload.work_location,
      bluetooth_enabled: payload.bluetooth_enabled,
    };
    try {
      localStorage.setItem(STORAGE_KEY_CACHED_PROFILE, JSON.stringify(profileToCache));
    } catch {
      // ignore
    }
  }

  // Try submitting to backend API if available
  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
    await fetch(`${apiBase}/api/citizen/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        ...payload,
        citizen_id: citizenId,
        browser_identifier: browserIdentifier,
      }),
    });
  } catch (err) {
    console.debug('Online registration sync skipped, offline cache active:', err);
  }

  return {
    status: 'success',
    citizen_id: citizenId,
    browser_identifier: browserIdentifier,
    message: 'Citizen pre-registration completed successfully. Offline emergency pack provisioned.',
    guide_bundle: guideBundle,
  };
}
