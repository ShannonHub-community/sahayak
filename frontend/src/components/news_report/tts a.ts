import type { NextApiRequest, NextApiResponse } from 'next';

interface TTSRequest {
  text: string;
  language?: string;
}

interface TTSResponse {
  success: boolean;
  message?: string;
  audioUrl?: string | null;
  language?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TTSResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { text, language = 'en' } = req.body as TTSRequest;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for TTS synthesis' });
    }

    // Return synthesis instruction (backend Sarvam TTS handshake)
    return res.status(200).json({
      success: true,
      message: 'TTS synthesis ready',
      audioUrl: null, // Will use client speech synthesis or stream when Sarvam key attached
      language,
    });
  } catch (err: any) {
    console.error('Error in TTS endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error during TTS synthesis' });
  }
}
