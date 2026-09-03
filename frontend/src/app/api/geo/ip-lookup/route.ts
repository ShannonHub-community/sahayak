import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Try ip-api.com
    try {
      const res = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon', {
        headers: { 'User-Agent': 'Sahayak-Disaster-Portal/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && typeof data.lat === 'number' && typeof data.lon === 'number') {
          return NextResponse.json({
            lat: Number(data.lat.toFixed(6)),
            lng: Number(data.lon.toFixed(6)),
            accuracy: 10000,
            isApproximate: true,
            city: data.city || '',
            region: data.regionName || '',
          });
        }
      }
    } catch {
      // Fall through to secondary service
    }

    // 2. Try ipwho.is as backup
    try {
      const res = await fetch('https://ipwho.is/', {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          return NextResponse.json({
            lat: Number(data.latitude.toFixed(6)),
            lng: Number(data.longitude.toFixed(6)),
            accuracy: 10000,
            isApproximate: true,
            city: data.city || '',
            region: data.region || '',
          });
        }
      }
    } catch {
      // Fall through
    }

    return NextResponse.json(
      { error: 'Could not determine IP location from network services' },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal IP lookup error' },
      { status: 500 }
    );
  }
}
