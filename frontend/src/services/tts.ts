/**
 * Browser-Native Web Speech API Text-to-Speech (TTS) Service
 * Operates 100% client-side & offline with zero backend dependencies.
 */

import type { LanguageCode } from '@/types/translation';

/**
 * Standard BCP-47 language tag mappings for all 11 supported Indian languages
 */
export const BCP47_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

/**
 * Checks if the current browser environment supports the Web Speech Synthesis API.
 */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Stop any ongoing speech synthesis across the application.
 */
export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export interface VoiceMatchResult {
  voice: SpeechSynthesisVoice | null;
  isExactLanguageMatch: boolean;
}

/**
 * Attempts to locate the best installed SpeechSynthesisVoice for a given language code.
 * Falls back gracefully to matching language family, Indian English ('en-IN'),
 * or the default browser voice if the exact locale voice is not installed.
 */
export function findBestVoiceForLanguage(languageCode: string): VoiceMatchResult {
  if (!isSpeechSynthesisSupported()) {
    return { voice: null, isExactLanguageMatch: false };
  }

  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) {
    return { voice: null, isExactLanguageMatch: false };
  }

  const targetBcp47 = (BCP47_LANGUAGE_MAP[languageCode] || languageCode).toLowerCase().replace('_', '-');
  const targetPrefix = languageCode.toLowerCase().split('-')[0];

  // 1. Exact BCP-47 match (e.g. "hi-IN", "mr-IN")
  const exact = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === targetBcp47;
  });
  if (exact) {
    return { voice: exact, isExactLanguageMatch: true };
  }

  // 2. Language prefix match (e.g. "hi", "mr", "ta")
  const prefixMatch = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(targetPrefix);
  });
  if (prefixMatch) {
    return { voice: prefixMatch, isExactLanguageMatch: true };
  }

  // 3. Indian English fallback voice (closest natural regional accent for disaster bulletins)
  const indianEnglish = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === 'en-in';
  });
  if (indianEnglish) {
    return { voice: indianEnglish, isExactLanguageMatch: false };
  }

  // 4. Default voice or first English voice
  const defaultVoice = voices.find((v) => v.default) || voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  return { voice: defaultVoice || voices[0] || null, isExactLanguageMatch: false };
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
  onVoiceUnavailable?: (info: { requested: string; fallbackLang: string }) => void;
}

export interface SpeechControl {
  stop: () => void;
}

/**
 * Speaks alert text using the browser's native Web Speech API directly.
 * Operates completely offline without any backend API calls.
 */
export function getAudioForAlert(
  text: string,
  language: LanguageCode | string = 'en',
  callbacks?: SpeakCallbacks
): SpeechControl {
  if (!isSpeechSynthesisSupported()) {
    callbacks?.onError?.(new Error('SpeechSynthesis is not supported in this browser.'));
    return { stop: () => {} };
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const bcp47 = BCP47_LANGUAGE_MAP[language] || 'en-IN';
    utterance.lang = bcp47;
    utterance.rate = 0.95; // Slightly slower pace for maximum emergency clarity

    // Select best matching voice
    const { voice, isExactLanguageMatch } = findBestVoiceForLanguage(language);
    if (voice) {
      utterance.voice = voice;
    }

    if (!isExactLanguageMatch && language !== 'en') {
      callbacks?.onVoiceUnavailable?.({
        requested: language,
        fallbackLang: voice ? voice.lang : 'en-IN',
      });
    }

    let hasStarted = false;

    utterance.onstart = () => {
      hasStarted = true;
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      // Don't treat user-initiated cancel as an error
      if (e.error === 'canceled' || e.error === 'interrupted') {
        callbacks?.onEnd?.();
        return;
      }
      console.warn('SpeechSynthesis error event:', e);
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);

    // Fallback for browsers that delay onstart
    const startTimer = setTimeout(() => {
      if (!hasStarted && window.speechSynthesis.speaking) {
        callbacks?.onStart?.();
      }
    }, 150);

    return {
      stop: () => {
        clearTimeout(startTimer);
        stopSpeech();
        callbacks?.onEnd?.();
      },
    };
  } catch (err) {
    console.warn('SpeechSynthesis execution failed:', err);
    callbacks?.onError?.(err);
    callbacks?.onEnd?.();
    return { stop: () => {} };
  }
}

// Alias for semantic clarity
export const speakAlertText = getAudioForAlert;
