const STORAGE_KEY_BROWSER_ID = 'sahayak_citizen_browser_id';
const STORAGE_KEY_SESSION_ID = 'sahayak_citizen_session_id';

/**
 * Retrieves the persistent citizen browser identifier if previously registered.
 * Returns null if not yet registered.
 */
export function getBrowserIdentifier(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem(STORAGE_KEY_BROWSER_ID);
    if (id && id.trim().length > 0) {
      return id.trim();
    }
    // Check fallback cookie
    const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY_BROWSER_ID + '=([^;]+)'));
    if (match && match[2]) {
      return decodeURIComponent(match[2]);
    }
  } catch (err) {
    console.warn('Unable to access localStorage/cookie for browser identifier:', err);
  }
  return null;
}

/**
 * Persists the registered citizen identifier for future recognition.
 */
export function setBrowserIdentifier(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    localStorage.setItem(STORAGE_KEY_BROWSER_ID, id.trim());
    // Also set 1-year cookie for resilience
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${STORAGE_KEY_BROWSER_ID}=${encodeURIComponent(id.trim())}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('Unable to persist browser identifier:', err);
  }
}

/**
 * Returns a unique browser session UUID used for backend deduplication and drift tracking.
 * Persists for the browser session.
 */
export function getBrowserSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-session-placeholder';
  }
  try {
    let sessionId = sessionStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (!sessionId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        sessionId = crypto.randomUUID();
      } else {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
      sessionStorage.setItem(STORAGE_KEY_SESSION_ID, sessionId);
    }
    return sessionId;
  } catch {
    return 'fallback-sess-' + Date.now();
  }
}
