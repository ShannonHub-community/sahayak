import type { NextApiRequest, NextApiResponse } from 'next';
import type { CitizenProfile } from '@/types/sos';
import { citizenStore } from './_mockStore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CitizenProfile | { message: string }>
) {
  const { browser_id } = req.query;

  if (!browser_id || typeof browser_id !== 'string') {
    return res.status(400).json({ message: 'Browser ID required' });
  }

  const profile = citizenStore.get(browser_id.trim());

  if (profile) {
    return res.status(200).json(profile);
  }

  return res.status(404).json({ message: 'No registered profile found for this device' });
}

