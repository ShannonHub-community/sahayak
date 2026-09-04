'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Clock, 
  Shield, 
  Volume2, 
  Square, 
  MapPin,
  Loader2
} from 'lucide-react';
import type { PublicAlert, AlertSeverity } from '@/types/alerts';
import type { LanguageCode } from '@/types/translation';
import { 
  getAudioForAlert, 
  stopSpeech, 
  isTTSAvailable,
  type SpeechControl 
} from '@/services/tts';

export interface AlertCardProps {
  alert: PublicAlert;
  translatedTitle?: string;
  translatedMessage?: string;
  activeLanguage?: LanguageCode | string;
}

// Format timestamp cleanly for citizens
function formatAlertTime(isoString: string): { relative: string; full: string } {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = 'Just now';
    if (diffMinutes >= 1 && diffMinutes < 60) {
      relative = `${diffMinutes}m ago`;
    } else if (diffHours >= 1 && diffHours < 24) {
      relative = `${diffHours}h ago`;
    } else if (diffDays >= 1) {
      relative = `${diffDays}d ago`;
    }

    const full = date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return { relative, full };
  } catch {
    return { relative: 'Recent', full: isoString };
  }
}

export const AlertCard: React.FC<AlertCardProps> = ({ 
  alert, 
  translatedTitle, 
  translatedMessage,
  activeLanguage = 'en'
}) => {
  const { relative, full } = formatAlertTime(alert.timestamp);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const currentControlRef = useRef<SpeechControl | null>(null);

  const ttsAvailable = useSyncExternalStore(
    () => () => {},
    () => isTTSAvailable(),
    () => false
  );
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const displayTitle = translatedTitle || alert.title;
  const displayMessage = translatedMessage || alert.message;

  // Cleanup speech and active audio on unmount
  useEffect(() => {
    return () => {
      currentControlRef.current?.stop();
      stopSpeech();
    };
  }, []);

  // Listen for global stop-audio event so only one card speaks at a time
  useEffect(() => {
    const handleGlobalStop = (e: Event) => {
      const customEvent = e as CustomEvent<{ sourceId: string }>;
      if (customEvent.detail?.sourceId !== alert.id) {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        currentControlRef.current?.stop();
        currentControlRef.current = null;
      }
    };

    window.addEventListener('sahayak-stop-alert-audio', handleGlobalStop);
    return () => {
      window.removeEventListener('sahayak-stop-alert-audio', handleGlobalStop);
    };
  }, [alert.id]);

  const handleToggleAudio = () => {
    if (isPlaying || isLoadingAudio) {
      currentControlRef.current?.stop();
      stopSpeech();
      setIsPlaying(false);
      setIsLoadingAudio(false);
      currentControlRef.current = null;
      return;
    }

    // Notify other cards to stop speaking
    window.dispatchEvent(
      new CustomEvent('sahayak-stop-alert-audio', { detail: { sourceId: alert.id } })
    );

    setVoiceNotice(null);
    const fullTextToRead = `${displayTitle}. ${displayMessage}`;

    currentControlRef.current = getAudioForAlert(fullTextToRead, activeLanguage, {
      onLoading: (loading) => {
        setIsLoadingAudio(loading);
      },
      onStart: () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        currentControlRef.current = null;
      },
      onError: (err) => {
        console.warn('[AlertCard Diagnosis] Real underlying TTS error received:', err);
        setIsPlaying(false);
        setIsLoadingAudio(false);
        currentControlRef.current = null;
        setVoiceNotice(
          'Audio unavailable: Unable to generate speech audio for this alert right now.'
        );
      },
      onVoiceUnavailable: (info) => {
        if (info.fallbackLang) {
          setVoiceNotice(
            `Device voice for ${info.requested.toUpperCase()} not installed. Speaking in regional voice (${info.fallbackLang}).`
          );
        }
      },
    });
  };

  const severityConfig: Record<
    AlertSeverity,
    {
      borderClass: string;
      badgeClass: string;
      badgeText: string;
      icon: React.ReactNode;
      pillText: string;
    }
  > = {
    critical: {
      borderClass: 'border-l-4 border-l-red-600 border-gray-300',
      badgeClass: 'bg-red-50 text-red-800 border-red-300',
      badgeText: 'CRITICAL ALERT / अति संवेदनशील',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />,
      pillText: 'EVACUATION / DISASTER',
    },
    warning: {
      borderClass: 'border-l-4 border-l-amber-500 border-gray-300',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
      badgeText: 'WARNING / चेतावनी',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />,
      pillText: 'METEOROLOGICAL WATCH',
    },
    info: {
      borderClass: 'border-l-4 border-l-blue-600 border-gray-300',
      badgeClass: 'bg-blue-50 text-[#0B3D6E] border-blue-200',
      badgeText: 'OFFICIAL ADVISORY / सूचना',
      icon: <Info className="w-3.5 h-3.5 text-[#0B3D6E] flex-shrink-0" />,
      pillText: 'PUBLIC RELIEF',
    },
  };

  const currentConfig = severityConfig[alert.severity] || severityConfig.info;

  return (
    <article
      className={`w-full bg-white border rounded-md p-4 sm:p-5 shadow-xs transition-colors hover:bg-gray-50/50 ${currentConfig.borderClass}`}
      aria-labelledby={`alert-title-${alert.id}`}
    >
      {/* Header: Severity Badge + State + ID + Timestamp + Native Speech TTS Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5 mb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase rounded border ${currentConfig.badgeClass}`}
          >
            {currentConfig.icon}
            <span>{currentConfig.badgeText}</span>
          </span>

          {/* Location / State Badge */}
          {alert.state && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 rounded border border-slate-200">
              <MapPin className="w-3 h-3 text-[#0B3D6E]" />
              <span>{alert.state}</span>
            </span>
          )}

          <span className="text-[10px] font-mono text-gray-400 hidden sm:inline-block">
            {alert.id}
          </span>
        </div>

        {/* Timestamp & Native Speech TTS Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1 text-[11px] text-gray-600 font-mono"
            title={`Published at ${full}`}
          >
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="font-semibold text-gray-800">{relative}</span>
            <span className="text-gray-400 hidden md:inline">({full})</span>
          </div>

          {/* TTS Button (Native instant or Backend fallback with loading state) */}
          {ttsAvailable && (
            <button
              type="button"
              onClick={handleToggleAudio}
              aria-label={
                isPlaying
                  ? 'Stop reading alert aloud'
                  : isLoadingAudio
                  ? 'Generating alert audio...'
                  : 'Read alert aloud via speech audio'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold transition-colors border cursor-pointer ${
                isPlaying
                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                  : isLoadingAudio
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#0B3D6E] border-slate-300'
              }`}
              title={
                isPlaying
                  ? 'Stop reading alert'
                  : isLoadingAudio
                  ? 'Generating audio via server...'
                  : 'Listen to this alert'
              }
            >
              {isPlaying ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span className="text-[11px]">Stop</span>
                </>
              ) : isLoadingAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span className="text-[11px]">Loading...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[11px]">Listen / सुनें</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Voice notice banner if specific language voice not installed on device */}
      {voiceNotice && (
        <div className="mb-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center justify-between gap-1">
          <span>{voiceNotice}</span>
          <button
            type="button"
            onClick={() => setVoiceNotice(null)}
            className="text-amber-900 font-bold hover:underline ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title (Translated or Original) */}
      <h2
        id={`alert-title-${alert.id}`}
        className="text-sm sm:text-base font-bold text-gray-900 leading-snug mb-2"
      >
        {displayTitle}
      </h2>

      {/* Message Body (Translated or Original) */}
      <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
        {displayMessage}
      </p>

      {/* Official Government Verification Footer */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#0B3D6E]" />
          <span>Verified Government Release • National Disaster Grid</span>
        </div>
        <span className="font-mono text-gray-400">
          {activeLanguage !== 'en' && (translatedTitle || translatedMessage)
            ? `TRANSLATED (${activeLanguage.toUpperCase()})`
            : 'READ-ONLY FEED'}
        </span>
      </div>
    </article>
  );
};
