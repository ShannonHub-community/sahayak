import React from 'react';

interface ShelterProgressBarProps {
  capacity: number;
  occupancy: number;
}

export const ShelterProgressBar: React.FC<ShelterProgressBarProps> = ({ capacity, occupancy }) => {
  const ratio = capacity > 0 ? (occupancy / capacity) * 100 : 0;
  const ratioClamped = Math.min(Math.max(ratio, 0), 100);

  let colorClass = 'bg-emerald-500';
  let textClass = 'text-emerald-300';
  if (ratio >= 90) {
    colorClass = 'bg-rose-500';
    textClass = 'text-rose-300 font-bold';
  } else if (ratio >= 70) {
    colorClass = 'bg-amber-500';
    textClass = 'text-amber-300';
  }

  return (
    <div className="flex flex-col w-full min-w-[120px] max-w-[200px] gap-1">
      <div className="flex justify-between items-center text-xs">
        <span className={`${textClass} font-mono`}>
          {occupancy} / {capacity} ({Math.round(ratio)}%)
        </span>
        {ratio >= 90 && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-600/80 animate-pulse">● CRITICAL OVERCROWDING</span>}
      </div>
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-300 dark:border-zinc-700">
        <div className={`h-full transition-all duration-150 ${colorClass}`} style={{ width: `${ratioClamped}%` }} />
      </div>
    </div>
  );
};
