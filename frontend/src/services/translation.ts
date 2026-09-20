import type {
  LanguageCode,
  TranslationRequest,
  TranslationResponse,
  TranslateItem,
} from '@/types/translation';

const STORAGE_LANG_KEY = 'sahayak_selected_language';

export function getSavedLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode;
    return saved || 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguage(lang: LanguageCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  } catch (e) {
    console.warn('Unable to persist language in localStorage:', e);
  }
}

export interface TranslatedAlertsMap {
  [alertId: string]: {
    title: string;
    message: string;
  };
}

/**
 * Service function to translate alerts into target language.
 * Calls backend endpoint POST /api/comms/translate (which wraps Cloud Translation API)
 */
export async function translateAlerts(
  alerts: Array<{ id: string | number; title: string; message: string;[key: string]: any }>,
  languageCode: LanguageCode | string
): Promise<TranslatedAlertsMap> {
  // If English, return empty map (components render original text)
  if (languageCode === 'en' || !alerts || alerts.length === 0) {
    return {};
  }

  const items: TranslateItem[] = alerts.map((a) => ({
    id: String(a.id),
    title: a.title,
    message: a.message,
  }));

  const payload: TranslationRequest = {
    language: languageCode,
    items,
  };

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    let res: Response | null = null;
    try {
      res = await fetch('/api/comms/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      console.warn('Fetch to translation endpoint failed:', fetchErr);
    }

    if (!res || !res.ok) {
      throw new Error(`Translation endpoint failed: ${res ? res.status + ' ' + res.statusText : 'Network error'}`);
    }

    const data: TranslationResponse = await res.json();
    const map: TranslatedAlertsMap = {};

    if (Array.isArray(data.items)) {
      data.items.forEach((item) => {
        map[item.id] = {
          title: item.title,
          message: item.message,
        };
      });
    }

    return map;
  } catch (err) {
    console.warn('Translation call failed, falling back to original text:', err);
    return {};
  }
}
