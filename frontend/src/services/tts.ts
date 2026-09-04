/**
 * Hybrid Text-to-Speech (TTS) Service for Sahayak
 *
 * 1. Native Web Speech API (First attempt):
 *    Ultra-fast, 100% client-side & offline when a matching voice is installed on device
 *    (e.g., English, Hindi on Windows/Chrome).
 *
 * 2. Backend Sarvam TTS Fallback (Second attempt):
 *    Seamless fallback to POST /api/comms/tts when no local voice is installed for the
 *    requested Indic language (Marathi, Bengali, Gujarati, Kannada, Malayalam, Odia,
 *    Punjabi, Tamil, Telugu), playing audio via HTML5 <audio>.
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

// Module-level references for tracking active audio playback & abort controller
let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioBlobUrl: string | null = null;
let activeAbortController: AbortController | null = null;

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
 * Checks if HTML5 Audio playback is supported.
 */
export function isAudioElementSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
}

/**
 * Checks whether TTS is available in this environment via either native speech
 * synthesis or backend audio streaming.
 */
export function isTTSAvailable(): boolean {
  return isSpeechSynthesisSupported() || isAudioElementSupported();
}

/**
 * Stop any ongoing speech or audio playback across the application.
 */
export function stopSpeech(): void {
  // 1. Abort any in-flight backend TTS fetch request
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // ignore
    }
    activeAbortController = null;
  }

  // 2. Stop and release any active HTML5 Audio playback
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

  if (activeAudioBlobUrl) {
    try {
      URL.revokeObjectURL(activeAudioBlobUrl);
    } catch {
      // ignore
    }
    activeAudioBlobUrl = null;
  }

  // 3. Cancel any native Web Speech synthesis
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

// Diagnostic listener: logs voices when available or when loaded asynchronously by browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const logVoices = () => {
    const voices = window.speechSynthesis.getVoices() || [];
    console.log('[TTS Diagnosis] window.speechSynthesis.getVoices():', voices);
  };

  // Run on initial script evaluation
  logVoices();

  // Listen for voiceschanged event (Chromium browsers load voices asynchronously)
  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', logVoices);
  } else if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = logVoices;
  }
}

export interface VoiceMatchResult {
  voice: SpeechSynthesisVoice | null;
  isExactLanguageMatch: boolean;
  matchType: 'exact' | 'close' | 'none';
}

/**
 * Attempts to locate the best installed SpeechSynthesisVoice for a given language code.
 * Checks for:
 * 1. Exact BCP-47 match (e.g. 'mr-IN', 'hi-IN', 'ta-IN')
 * 2. Close match: same language with different region code (e.g. 'en-US' for 'en-IN', 'bn-BD' for 'bn-IN')
 * 3. Returns null if no voice for this language family exists on the device.
 *    (Never falls back to an unrelated English voice for non-English languages).
 */
export function findBestVoiceForLanguage(languageCode: string): VoiceMatchResult {
  if (!isSpeechSynthesisSupported()) {
    return { voice: null, isExactLanguageMatch: false, matchType: 'none' };
  }

  const voices = window.speechSynthesis.getVoices() || [];

  if (voices.length === 0) {
    return { voice: null, isExactLanguageMatch: false, matchType: 'none' };
  }

  const normalizedCode = languageCode.toLowerCase().replace('_', '-');
  const targetBcp47 = (BCP47_LANGUAGE_MAP[normalizedCode] || normalizedCode).toLowerCase();
  const targetPrefix = targetBcp47.split('-')[0];

  // 1. Exact BCP-47 match (e.g. "hi-IN", "mr-IN", "ta-IN", "en-IN")
  const exact = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === targetBcp47;
  });
  if (exact) {
    return { voice: exact, isExactLanguageMatch: true, matchType: 'exact' };
  }

  // 2. Close match: same language, different region code or generic language code
  const closeMatch = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === targetPrefix || vLang.startsWith(`${targetPrefix}-`);
  });
  if (closeMatch) {
    return { voice: closeMatch, isExactLanguageMatch: false, matchType: 'close' };
  }

  // 3. Truly no voice is available for that language on this device.
  return { voice: null, isExactLanguageMatch: false, matchType: 'none' };
}

/**
 * Checks if the device has an exact or close voice installed for the given language.
 */
export function isLanguageVoiceAvailable(languageCode: string): boolean {
  return findBestVoiceForLanguage(languageCode).voice !== null;
}

/**
 * Returns a deduplicated list of all language codes currently installed on the device.
 */
export function getInstalledVoiceLanguages(): string[] {
  if (!isSpeechSynthesisSupported()) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  const langs = new Set<string>();
  voices.forEach((v) => {
    if (v.lang) langs.add(v.lang.toLowerCase().replace('_', '-'));
  });
  return Array.from(langs);
}

export interface SpeakCallbacks {
  onLoading?: (isLoading: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
  onVoiceUnavailable?: (info: { requested: string; fallbackLang: string; reason?: string }) => void;
}

export interface SpeechControl {
  stop: () => void;
}

/**
 * Plays speech using backend Sarvam TTS endpoint (POST /api/comms/tts) via HTML5 Audio element.
 */
async function playBackendTTS(
  text: string,
  language: string,
  callbacks?: SpeakCallbacks
): Promise<SpeechControl> {
  const controller = new AbortController();
  activeAbortController = controller;

  // Signal loading state while making network request
  callbacks?.onLoading?.(true);

  const normalizedLang = language.toLowerCase().split('-')[0].split('_')[0] || 'en';
  const truncatedText = text.trim().slice(0, 1990);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const endpoint = apiBase ? `${apiBase}/api/comms/tts` : '/api/comms/tts';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        text: truncatedText,
        language: normalizedLang,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        const errorJson = await response.json();
        errorBody = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
      } catch {
        errorBody = await response.text().catch(() => '');
      }

      console.warn(
        `[TTS Diagnosis] /api/comms/tts failed with HTTP ${response.status} (${response.statusText}):`,
        {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorBody,
          requestPayload: { text: truncatedText, language: normalizedLang },
        }
      );

      throw new Error(`Backend TTS failed (${response.status}): ${errorBody || response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let audioSrc: string;

    if (contentType.includes('json')) {
      const data = await response.json();
      if (data.audioUrl) {
        audioSrc = data.audioUrl;
      } else if (data.audio_base64) {
        audioSrc = `data:audio/wav;base64,${data.audio_base64}`;
      } else if (data.audio) {
        audioSrc = `data:audio/wav;base64,${data.audio}`;
      } else {
        throw new Error('Unexpected JSON format from TTS backend');
      }
    } else {
      // Raw audio bytes (audio/wav from FastAPI Response)
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Received empty audio stream from TTS backend');
      }
      audioSrc = URL.createObjectURL(blob);
      activeAudioBlobUrl = audioSrc;
    }

    // Check if playback was cancelled while fetching
    if (controller.signal.aborted) {
      if (activeAudioBlobUrl) {
        URL.revokeObjectURL(activeAudioBlobUrl);
        activeAudioBlobUrl = null;
      }
      return { stop: () => {} };
    }

    const audio = new Audio(audioSrc);
    activeAudioElement = audio;

    const cleanup = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      if (activeAudioBlobUrl) {
        URL.revokeObjectURL(activeAudioBlobUrl);
        activeAudioBlobUrl = null;
      }
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    };

    audio.onplay = () => {
      callbacks?.onLoading?.(false);
      callbacks?.onStart?.();
    };

    audio.onended = () => {
      cleanup();
      callbacks?.onLoading?.(false);
      callbacks?.onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn('[TTS] HTML5 Audio playback error:', e);
      cleanup();
      callbacks?.onLoading?.(false);
      callbacks?.onError?.(new Error('Audio playback failed in HTML5 player.'));
      callbacks?.onEnd?.();
    };

    await audio.play();

    return {
      stop: () => {
        controller.abort();
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // ignore
        }
        cleanup();
        callbacks?.onLoading?.(false);
        callbacks?.onEnd?.();
      },
    };
  } catch (err: unknown) {
    // If request was aborted by user clicking Stop, exit cleanly
    if (controller.signal.aborted) {
      callbacks?.onLoading?.(false);
      return { stop: () => {} };
    }

    console.warn('[TTS] Backend TTS fallback call failed:', err);
    callbacks?.onLoading?.(false);
    callbacks?.onError?.(err);
    callbacks?.onEnd?.();
    return { stop: () => {} };
  }
}

/**
 * Hybrid TTS Entrypoint:
 * 1. Attempts Native Web Speech API first (instant, offline).
 * 2. If no voice is installed for the requested language, seamlessly falls back to
 *    the backend Sarvam TTS endpoint (POST /api/comms/tts) played via HTML5 Audio.
 * 3. Only if both fail does it trigger onError.
 */
export function getAudioForAlert(
  text: string,
  language: LanguageCode | string = 'en',
  callbacks?: SpeakCallbacks
): SpeechControl {
  // Stop any previous speech synthesis or audio playback across the application
  stopSpeech();

  // Attempt 1: Native Web Speech API (if supported and matching voice installed)
  if (isSpeechSynthesisSupported()) {
    const { voice, isExactLanguageMatch } = findBestVoiceForLanguage(language);

    if (voice) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const bcp47 = BCP47_LANGUAGE_MAP[language] || 'en-IN';
        utterance.voice = voice;
        utterance.lang = voice.lang || bcp47;
        utterance.rate = 0.95; // Slightly slower pace for emergency clarity

        if (!isExactLanguageMatch) {
          callbacks?.onVoiceUnavailable?.({
            requested: language,
            fallbackLang: voice.lang,
            reason: `Using close regional match: ${voice.name} (${voice.lang})`,
          });
        }

        let hasStarted = false;

        utterance.onstart = () => {
          hasStarted = true;
          callbacks?.onLoading?.(false);
          callbacks?.onStart?.();
        };

        utterance.onend = () => {
          callbacks?.onEnd?.();
        };

        utterance.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
            callbacks?.onEnd?.();
            return;
          }
          console.warn('[TTS] Native SpeechSynthesis error event:', e);
          // Fall back to backend on native runtime failure
          playBackendTTS(text, language, callbacks);
        };

        window.speechSynthesis.speak(utterance);

        const startTimer = setTimeout(() => {
          if (!hasStarted && window.speechSynthesis.speaking) {
            callbacks?.onLoading?.(false);
            callbacks?.onStart?.();
          }
        }, 150);

        return {
          stop: () => {
            clearTimeout(startTimer);
            stopSpeech();
            callbacks?.onLoading?.(false);
            callbacks?.onEnd?.();
          },
        };
      } catch (nativeErr) {
        console.warn('[TTS] Native speech failed, attempting backend fallback:', nativeErr);
      }
    }
  }

  // Attempt 2: Backend Sarvam TTS Fallback (POST /api/comms/tts -> HTML5 Audio)
  if (isAudioElementSupported()) {
    let returnedControl: SpeechControl = { stop: () => {} };
    playBackendTTS(text, language, callbacks).then((ctrl) => {
      returnedControl = ctrl;
    });

    return {
      stop: () => {
        returnedControl.stop();
        stopSpeech();
      },
    };
  }

  // Attempt 3: No supported audio capabilities
  callbacks?.onError?.(new Error('Audio playback is not supported on this device.'));
  callbacks?.onEnd?.();
  return { stop: () => {} };
}

// Alias for semantic clarity
export const speakAlertText = getAudioForAlert;
