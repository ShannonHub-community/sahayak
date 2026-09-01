/**
 * Text-to-Speech (TTS) Service for Sahayak Citizen Portal
 * Calls backend endpoint POST /api/comms/tts and plays audio via HTML5 Audio / Web Speech API
 */

export interface TTSState {
  alertId: string | null;
  status: 'idle' | 'loading' | 'playing' | 'error';
  errorMsg?: string;
}

type TTSListener = (state: TTSState) => void;

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAlertId: string | null = null;
  private listeners: Set<TTSListener> = new Set();
  private state: TTSState = { alertId: null, status: 'idle' };

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: TTSState): void {
    this.state = state;
    this.listeners.forEach((fn) => fn(state));
  }

  public getState(): TTSState {
    return this.state;
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify({ alertId: null, status: 'idle' });
  }

  /**
   * Play alert text in the specified language
   */
  public async playAlertAudio(alertId: string, text: string, languageCode = 'en'): Promise<void> {
    // If already playing this alert, toggle pause/stop
    if (this.state.alertId === alertId && this.state.status === 'playing') {
      this.stop();
      return;
    }

    // Stop any previously playing audio
    this.stop();

    this.notify({ alertId, status: 'loading' });

    try {
      // 1. Call backend TTS endpoint
      const res = await fetch('/api/comms/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, language: languageCode }),
      });

      const contentType = res.headers.get('content-type') || '';

      // If backend returned raw audio stream (e.g. audio/mpeg or audio/wav)
      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        audio.onplay = () => {
          this.notify({ alertId, status: 'playing' });
        };
        audio.onended = () => {
          this.notify({ alertId: null, status: 'idle' });
        };
        audio.onerror = () => {
          this.fallbackSpeechSynthesis(alertId, text, languageCode);
        };

        await audio.play();
        return;
      }

      // If backend returned JSON with audioUrl or fallback signal
      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          this.currentAudio = audio;
          audio.onplay = () => this.notify({ alertId, status: 'playing' });
          audio.onended = () => this.notify({ alertId: null, status: 'idle' });
          audio.onerror = () => this.fallbackSpeechSynthesis(alertId, text, languageCode);
          await audio.play();
          return;
        }
      }

      // 2. Client-side SpeechSynthesis fallback (works offline and on standard mobile browsers)
      this.fallbackSpeechSynthesis(alertId, text, languageCode);
    } catch (err: any) {
      console.warn('TTS request error, attempting client synthesis fallback:', err);
      this.fallbackSpeechSynthesis(alertId, text, languageCode);
    }
  }

  private fallbackSpeechSynthesis(alertId: string, text: string, languageCode: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notify({ alertId, status: 'error', errorMsg: 'Audio playback not supported' });
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Map language code to standard speech synthesis locales
      const langMap: Record<string, string> = {
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

      utterance.lang = langMap[languageCode] || 'en-IN';
      utterance.rate = 0.95; // Slightly slower for clarity in disaster alerts

      utterance.onstart = () => {
        this.notify({ alertId, status: 'playing' });
      };

      utterance.onend = () => {
        this.notify({ alertId: null, status: 'idle' });
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.notify({ alertId, status: 'error', errorMsg: 'Audio failed to play. Tap to retry.' });
      };

      window.speechSynthesis.speak(utterance);
    } catch (e: any) {
      this.notify({ alertId, status: 'error', errorMsg: 'Speech synthesis failed' });
    }
  }
}

export const ttsService = new TTSService();
