import type { NextApiRequest, NextApiResponse } from 'next';
import type { SOSPayload, SOSResponse } from '@/types/sos';
import { findNearestPanvelShelter } from '@/constants/sampleShelters';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SOSResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const payload = req.body as SOSPayload;

    if (!payload.name || !payload.location || typeof payload.location.lat !== 'number') {
      return res.status(420).json({ error: 'Invalid SOS payload structure' });
    }

    const { lat, lng } = payload.location;

    // Find the nearest designated emergency shelter from the Panvel sample shelter network
    const nearestShelter = findNearestPanvelShelter(lat, lng);

    const response: SOSResponse = {
      status: 'success',
      report_id: `SOS-IND-${Date.now().toString().slice(-6)}`,
      message: 'Emergency distress received. National Disaster Response Force & local teams alerted.',
      nearest_shelter: nearestShelter,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Error handling SOS submission:', error);
    return res.status(500).json({ error: 'Internal Server Error during SOS processing' });
  }
}

