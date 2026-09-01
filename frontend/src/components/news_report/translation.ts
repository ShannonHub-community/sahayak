import type { LanguageCode, TranslationRequest, TranslationResponse } from '@/types/translation';
import type { PublicAlert } from '@/types/alerts';

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
 * Service function to translate alerts into target language
 * Calls backend endpoint POST /api/comms/translate (which wraps Sarvam API)
 */
export async function translateAlerts(
  alerts: PublicAlert[],
  languageCode: LanguageCode
): Promise<TranslatedAlertsMap> {
  // If English, no translation needed
  if (languageCode === 'en' || alerts.length === 0) {
    return {};
  }

  const payload: TranslationRequest = {
    language: languageCode,
    items: alerts.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
    })),
  };

  try {
    const res = await fetch('/api/comms/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Translation endpoint failed: ${res.statusText}`);
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
    // Graceful fallback: return empty map so original text is shown
    return {};
  }
}
