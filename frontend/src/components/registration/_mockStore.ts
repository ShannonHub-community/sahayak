import type { CitizenProfile } from '@/types/sos';
import type { CitizenRegistrationPayload, GuideBundle } from '@/types/registration';
import { generateSampleGuides } from '@/services/registration';

export const citizenStore = new Map<string, CitizenProfile>();
export const guidesStore = new Map<string, GuideBundle>();

export function generatePersonalizedGuides(citizenId: string, payload: CitizenRegistrationPayload): GuideBundle {
  return generateSampleGuides(citizenId, payload);
}
