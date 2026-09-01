import type { NextApiRequest, NextApiResponse } from 'next';

interface StateLookupRequest {
  lat: number;
  lng: number;
}

interface StateLookupResponse {
  state: string;
  district?: string;
  lat?: number;
  lng?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StateLookupResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { lat, lng } = req.body as StateLookupRequest;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Valid numeric lat and lng required' });
    }

    let detectedState = 'Maharashtra';
    let detectedDistrict = 'Raigad / MMR';

    // Simple approximate bounding boxes for Indian States (Server-side geo resolver)
    if (lat >= 15.6 && lat <= 22.0 && lng >= 72.6 && lng <= 80.9) {
      detectedState = 'Maharashtra';
      detectedDistrict = (lat >= 18.5 && lat <= 19.4 && lng >= 72.7 && lng <= 73.5) ? 'Raigad (Panvel) / MMR' : 'Maharashtra State';
    } else if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.5) {
      detectedState = 'Karnataka';
      detectedDistrict = 'Krishna Basin';
    } else if (lat >= 15.8 && lat <= 19.9 && lng >= 77.2 && lng <= 81.3) {
      detectedState = 'Telangana';
      detectedDistrict = 'Godavari Basin';
    } else if (lat >= 8.2 && lat <= 12.8 && lng >= 74.8 && lng <= 77.4) {
      detectedState = 'Kerala';
      detectedDistrict = 'Coastal / Idukki';
    } else if (lat >= 8.1 && lat <= 13.5 && lng >= 76.2 && lng <= 80.3) {
      detectedState = 'Tamil Nadu';
      detectedDistrict = 'Cauvery Basin / Chennai';
    } else if (lat >= 12.6 && lat <= 19.1 && lng >= 76.7 && lng <= 84.8) {
      detectedState = 'Andhra Pradesh';
      detectedDistrict = 'Godavari / Coastal';
    } else if (lat >= 17.8 && lat <= 22.6 && lng >= 81.3 && lng <= 87.5) {
      detectedState = 'Odisha';
      detectedDistrict = 'Mahanadi Basin / Coastal';
    } else if (lat >= 20.1 && lat <= 24.7 && lng >= 68.1 && lng <= 74.5) {
      detectedState = 'Gujarat';
      detectedDistrict = 'Saurashtra / Narmada';
    } else if (lat >= 21.5 && lat <= 27.2 && lng >= 85.8 && lng <= 89.8) {
      detectedState = 'West Bengal';
      detectedDistrict = 'Sundarbans / Ganga Basin';
    }

    return res.status(200).json({
      state: detectedState,
      district: detectedDistrict,
      lat,
      lng,
    });
  } catch (err: any) {
    console.error('Error in state-lookup API:', err);
    return res.status(500).json({ error: 'Internal Server Error during state lookup' });
  }
}
