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
    const res = await fetch('/api/geo/state-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng }),
    });

    if (!res.ok) {
      throw new Error(`State lookup failed: ${res.statusText}`);
    }

    const data: StateLookupResult = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to resolve state from coordinates, defaulting to nationwide:', err);
    // Fallback default for demo/Panvel region
    return { state: 'Maharashtra' };
  }
}
