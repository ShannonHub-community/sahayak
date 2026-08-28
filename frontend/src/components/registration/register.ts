import type { NextApiRequest, NextApiResponse } from 'next';
import type { CitizenRegistrationPayload, RegistrationResponse } from '@/types/registration';
import type { CitizenProfile } from '@/types/sos';
import { citizenStore, guidesStore, generatePersonalizedGuides } from './_mockStore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegistrationResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const payload = req.body as CitizenRegistrationPayload;

    if (!payload || !payload.name || !payload.phone || !payload.home_location) {
      return res.status(400).json({ message: 'Missing required registration fields (Name, Phone, or Home Location).' });
    }

    // Generate unique citizen_id and persistent browser_identifier token
    const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const citizenId = `CIT-IND-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;
    const browserIdentifier = `BID-IND-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

    // Build the citizen profile object to store
    const profile: CitizenProfile = {
      citizen_id: citizenId,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      gender: payload.gender,
      age: payload.age,
      blood_group: payload.blood_group,
      medical_conditions: payload.long_term_diseases.join(', '),
      long_term_diseases: payload.long_term_diseases,
      family_members_count: (payload.family_members?.length || 0) + 1,
      family_members: payload.family_members,
      home_location: payload.home_location,
      work_location: payload.work_location,
      bluetooth_enabled: payload.bluetooth_enabled,
    };

    // Store in mock memory store indexed by browser identifier
    citizenStore.set(browserIdentifier, profile);

    // Generate server-bundled personalized guides
    const guideBundle = generatePersonalizedGuides(citizenId, payload);
    guidesStore.set(citizenId, guideBundle);

    const responseData: RegistrationResponse = {
      status: 'success',
      citizen_id: citizenId,
      browser_identifier: browserIdentifier,
      message: 'Citizen pre-registration completed successfully. Offline emergency pack provisioned.',
      guide_bundle: guideBundle,
    };

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Error during citizen registration:', error);
    return res.status(500).json({ message: 'Internal server error while processing registration.' });
  }
}
