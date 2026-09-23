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

const STORAGE_CACHE_PREFIX = 'sahayak_trans_cache_';
const memoryCache = new Map<string, { title: string; message: string }>();

function getCachedTranslation(lang: string, id: string, title: string): { title: string; message: string } | null {
  const key = `${lang}:${id}:${title}`;
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`${STORAGE_CACHE_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.title && parsed?.message) {
          memoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }
  return null;
}

function setCachedTranslation(lang: string, id: string, title: string, data: { title: string; message: string }): void {
  const key = `${lang}:${id}:${title}`;
  memoryCache.set(key, data);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`${STORAGE_CACHE_PREFIX}${key}`, JSON.stringify(data));
    } catch {
      // sessionStorage unavailable or full
    }
  }
}

/**
 * Direct client-side Google translate fallback when backend endpoint is unreachable.
 */
async function clientTranslateText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim() || targetLang === 'en') {
    return text;
  }
  const lang = targetLang === 'or' ? 'or' : targetLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const joined = data[0]
          .map((part: any) => (part && part[0]) || '')
          .join('')
          .trim();
        if (joined) return joined;
      }
    }
  } catch {
    // client translation unavailable
  }
  return text;
}

/**
 * Service function to translate alerts into target language.
 * Uses /api/comms/translate with client caching and dynamic fallback.
 */
export async function translateAlerts(
  alerts: Array<{ id: string | number; title: string; message: string; [key: string]: any }>,
  languageCode: LanguageCode | string
): Promise<TranslatedAlertsMap> {
  if (languageCode === 'en' || !alerts || alerts.length === 0) {
    return {};
  }

  const map: TranslatedAlertsMap = {};
  const neededAlerts: Array<{ id: string | number; title: string; message: string }> = [];

  // Check cache first
  for (const alert of alerts) {
    const cached = getCachedTranslation(languageCode, String(alert.id), alert.title);
    if (cached) {
      map[String(alert.id)] = cached;
    } else {
      neededAlerts.push(alert);
    }
  }

  if (neededAlerts.length === 0) {
    return map;
  }

  const items: TranslateItem[] = neededAlerts.map((a) => ({
    id: String(a.id),
    title: a.title,
    message: a.message,
  }));

  const payload: TranslationRequest = {
    language: languageCode,
    items,
  };

  try {
    let res: Response | null = null;
    try {
      res = await fetch('/api/comms/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
    } catch (fetchErr) {
      console.warn('[translateAlerts] Fetch to translation endpoint failed, falling back:', fetchErr);
    }

    if (res && res.ok) {
      const data: TranslationResponse = await res.json();
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          const original = neededAlerts.find((a) => String(a.id) === item.id);
          // If translation is identical to original English, attempt client-side translate
          let finalTitle = item.title;
          let finalMessage = item.message;
          if (original && original.title === item.title && original.message === item.message) {
            finalTitle = await clientTranslateText(original.title, languageCode);
            finalMessage = await clientTranslateText(original.message, languageCode);
          }

          const transObj = { title: finalTitle, message: finalMessage };
          map[item.id] = transObj;
          if (original) {
            setCachedTranslation(languageCode, item.id, original.title, transObj);
          }
        }
        return map;
      }
    }
  } catch (err) {
    console.warn('[translateAlerts] Error in primary translation flow, initiating client fallback:', err);
  }

  // Fallback: Translate remaining alerts directly via client-side translation
  await Promise.all(
    neededAlerts.map(async (alert) => {
      if (!map[String(alert.id)]) {
        const [transTitle, transMessage] = await Promise.all([
          clientTranslateText(alert.title, languageCode),
          clientTranslateText(alert.message, languageCode),
        ]);
        const transObj = { title: transTitle, message: transMessage };
        map[String(alert.id)] = transObj;
        setCachedTranslation(languageCode, String(alert.id), alert.title, transObj);
      }
    })
  );

  return map;
}
