import React, { useEffect, useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Clock, 
  Shield, 
  Volume2, 
  VolumeX, 
  Square, 
  Loader2, 
  AlertCircle,
  MapPin
} from 'lucide-react';
import type { PublicAlert, AlertSeverity } from '@/types/alerts';
import { ttsService, type TTSState } from '@/services/tts';

interface AlertCardProps {
  alert: PublicAlert;
  translatedTitle?: string;
  translatedMessage?: string;
  activeLanguage?: string;
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
  const [ttsState, setTtsState] = useState<TTSState>({ alertId: null, status: 'idle' });

  // Subscribe to central TTS audio playback states
  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      if (state.alertId === alert.id) {
        setTtsState(state);
      } else {
        setTtsState({ alertId: null, status: 'idle' });
      }
    });
    return () => unsubscribe();
  }, [alert.id]);

  const displayTitle = translatedTitle || alert.title;
  const displayMessage = translatedMessage || alert.message;

  // Handle Play/Stop Audio TTS
  const handleToggleAudio = () => {
    const fullTextToRead = `${displayTitle}. ${displayMessage}`;
    ttsService.playAlertAudio(alert.id, fullTextToRead, activeLanguage);
  };

  const isCurrentPlaying = ttsState.alertId === alert.id && ttsState.status === 'playing';
  const isCurrentLoading = ttsState.alertId === alert.id && ttsState.status === 'loading';
  const isCurrentError = ttsState.alertId === alert.id && ttsState.status === 'error';

  // Severity styles strictly adhering to spec:
  // "Critical = red border/accent, Warning = amber border/accent, Info = blue border/accent"
  // "keep the rest of the card clean white/light-gray background for readability, not a fully-colored card"
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
      {/* Header: Severity Badge + Region + Timestamp + TTS Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5 mb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase rounded border ${currentConfig.badgeClass}`}
          >
            {currentConfig.icon}
            <span>{currentConfig.badgeText}</span>
          </span>

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

        {/* Timestamp & Text-to-Speech Button */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1 text-[11px] text-gray-600 font-mono"
            title={`Published at ${full}`}
          >
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="font-semibold text-gray-800">{relative}</span>
            <span className="text-gray-400 hidden md:inline">({full})</span>
          </div>

          {/* Text-to-Speech Listen Button (Per Card) */}
          <button
            type="button"
            onClick={handleToggleAudio}
            aria-label={isCurrentPlaying ? 'Stop reading alert aloud' : 'Read alert aloud via speech audio'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold transition-colors border ${
              isCurrentPlaying
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : isCurrentLoading
                ? 'bg-blue-50 text-[#0B3D6E] border-blue-200 cursor-wait'
                : isCurrentError
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-slate-100 hover:bg-slate-200 text-[#0B3D6E] border-slate-300'
            }`}
            title="Listen to this alert in selected language"
          >
            {isCurrentLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden xs:inline text-[11px]">Loading...</span>
              </>
            ) : isCurrentPlaying ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span className="text-[11px]">Stop</span>
              </>
            ) : isCurrentError ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[11px]">Retry Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline text-[11px]">Listen / सुनें</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Title */}
      <h2
        id={`alert-title-${alert.id}`}
        className="text-sm sm:text-base font-bold text-gray-900 leading-snug mb-2"
      >
        {displayTitle}
      </h2>

      {/* Message Body */}
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
          {activeLanguage !== 'en' ? `TRANSLATED (${activeLanguage.toUpperCase()})` : 'READ-ONLY FEED'}
        </span>
      </div>
    </article>
  );
};
