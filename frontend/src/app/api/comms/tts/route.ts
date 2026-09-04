import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const backendUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';
  const apiBase = backendUrl.replace(/\/+$/, '');

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json(
        { error: 'Invalid request: "text" field is required.' },
        { status: 400 }
      );
    }

    const language = (body.language || 'en').toString().toLowerCase().split('-')[0];
    const text = body.text.trim().slice(0, 2000);

    const backendRes = await fetch(`${apiBase}/api/comms/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ text, language }),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => '');
      console.warn(
        `[TTS Proxy] Backend returned status ${backendRes.status}:`,
        errorText
      );
      return NextResponse.json(
        { 
          error: `TTS backend failed: ${backendRes.statusText || 'Error'}`,
          detail: errorText,
          targetUrl: `${apiBase}/api/comms/tts`,
          status: backendRes.status
        },
        { status: backendRes.status >= 400 && backendRes.status < 600 ? backendRes.status : 502 }
      );
    }

    const contentType = backendRes.headers.get('content-type') || 'audio/wav';
    const audioBuffer = await backendRes.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[TTS Proxy] Error contacting backend TTS:', err);
    return NextResponse.json(
      { 
        error: 'Text-to-speech backend is currently unreachable.',
        detail: errorMsg,
        targetUrl: `${apiBase}/api/comms/tts`
      },
      { status: 502 }
    );
  }
}
