const STORAGE_KEY_OFFLINE_GUIDES = 'sahayak_offline_emergency_guides';

export interface FirstAidGuideContent {
  title: string;
  steps: string[];
}

export function hasOfflineGuides(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_GUIDES);
    return Boolean(raw && raw.length > 0);
  } catch {
    return false;
  }
}

export async function getCachedGuide(guideKey: string): Promise<FirstAidGuideContent | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_GUIDES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (guideKey === 'first-aid' && parsed.first_aid_guide) {
      return parsed.first_aid_guide;
    }
    return parsed[guideKey] || null;
  } catch {
    return null;
  }
}

export function saveOfflineGuides(guideBundle: any): void {
  if (typeof window === 'undefined' || !guideBundle) return;
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_GUIDES, JSON.stringify(guideBundle));
    window.dispatchEvent(new CustomEvent('sahayak-offline-cache-updated'));
  } catch (err) {
    console.warn('Unable to cache offline emergency guides:', err);
  }
}
