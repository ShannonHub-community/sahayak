import React from 'react';
import { AlertOctagon, AlertTriangle, Info, Clock, Shield } from 'lucide-react';
import type { PublicAlert, AlertSeverity } from '@/types/alerts';

interface AlertCardProps {
  alert: PublicAlert;
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

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const { relative, full } = formatAlertTime(alert.timestamp);

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
      {/* Header: Severity Badge + Category Pill + Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase rounded border ${currentConfig.badgeClass}`}
          >
            {currentConfig.icon}
            <span>{currentConfig.badgeText}</span>
          </span>

          <span className="text-[10px] font-mono text-gray-500 hidden sm:inline-block">
            {alert.id}
          </span>
        </div>

        {/* Timestamp */}
        <div
          className="flex items-center gap-1 text-[11px] text-gray-600 font-mono"
          title={`Published at ${full}`}
        >
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-gray-800">{relative}</span>
          <span className="text-gray-400 hidden sm:inline">({full})</span>
        </div>
      </div>

      {/* Title */}
      <h2
        id={`alert-title-${alert.id}`}
        className="text-sm sm:text-base font-bold text-gray-900 leading-snug mb-2"
      >
        {alert.title}
      </h2>

      {/* Message Body */}
      <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
        {alert.message}
      </p>

      {/* Official Government Verification Footer */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#0B3D6E]" />
          <span>Verified Government Release • National Disaster Grid</span>
        </div>
        <span className="font-mono text-gray-400">READ-ONLY FEED</span>
      </div>
    </article>
  );
};
