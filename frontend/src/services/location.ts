export interface StateLookupResult {
  state: string;
  district?: string;
}

/**
 * Sends coordinates to backend geo endpoint to determine Indian State
 * Matches server-side geo-lookup architecture
 */
export async function getStateFromCoordinates(
  lat: number,
  lng: number
): Promise<StateLookupResult> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    let res: Response | null = null;
    try {
      res = await fetch(`${apiBase}/api/geo/state-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });
    } catch {
      if (!apiBase) {
        res = await fetch('http://localhost:8000/api/geo/state-lookup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lat, lng }),
        }).catch(() => null);
      }
    }

    if (!res || !res.ok) {
      throw new Error(`State lookup failed: ${res ? res.statusText : 'Network error'}`);
    }

    const data: StateLookupResult = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to resolve state from coordinates, defaulting to nationwide:', err);
    // Fallback default for demo/Panvel region
    return { state: 'Maharashtra' };
  }
}
