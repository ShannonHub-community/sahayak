"use client";

import React from 'react';
import { useResourceStore } from './useResourceStore';
import { AlertTriangle, Users, TrendingDown } from 'lucide-react';

export const AIInsightCards: React.FC = () => {
  const aiInsights = useResourceStore((state) => state.aiInsights);

  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case 'red': return 'border-rose-800/60 bg-rose-950/40 text-rose-300';
      case 'amber': return 'border-amber-800/60 bg-amber-950/40 text-amber-300';
      case 'blue': return 'border-blue-800/60 bg-blue-950/40 text-blue-300';
      default: return 'border-zinc-700 bg-zinc-900/40 text-zinc-300';
    }
  };

  const getIcon = (type: string, severity: string) => {
    const color = severity === 'red' ? 'text-rose-400' : severity === 'amber' ? 'text-amber-400' : 'text-blue-400';
    if (type === 'overcrowding') return <Users className={`w-5 h-5 ${color}`} />;
    if (type === 'shortage' || type === 'depletion') return <TrendingDown className={`w-5 h-5 ${color}`} />;
    return <AlertTriangle className={`w-5 h-5 ${color}`} />;
  };

  if (aiInsights.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" /> AI Insights & Alerts
      </h3>
      {aiInsights.map((insight) => (
        <div key={insight.id} className={`p-3 rounded border shadow-sm ${getSeverityClasses(insight.severity)}`}>
          <div className="flex items-start gap-3">
            {getIcon(insight.type, insight.severity)}
            <div>
              <h4 className="text-sm font-bold text-zinc-100">{insight.title}</h4>
              <p className="text-xs mt-1 text-zinc-300 line-clamp-2">{insight.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
