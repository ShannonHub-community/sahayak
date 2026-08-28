import React from 'react';
import { useCommsStore } from './useCommsStore';
import { Eye, EyeOff, Clock, Search } from 'lucide-react';
import { NewsTimelineEntry } from './types';

export const TabTransparencyTimeline: React.FC = () => {
  const { timelineEntries, toggleTimelineVisibility } = useCommsStore();

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
            Transparency & Action Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">Real-time public audit feed moderation</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search timeline..." 
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f2942] focus:border-[#0f2942]"
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {timelineEntries.map((entry) => (
            <TimelineCard 
              key={entry.id} 
              entry={entry} 
              onToggleVisibility={(visible) => toggleTimelineVisibility(entry.id, visible)}
              severityStyle={getSeverityStyles(entry.severity)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TimelineCard: React.FC<{ entry: NewsTimelineEntry; onToggleVisibility: (v: boolean) => void; severityStyle: string }> = ({ entry, onToggleVisibility, severityStyle }) => {
  const isVisible = entry.public_visible;

  return (
    <div className="relative pl-6">
      {/* Timeline dot */}
      <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 border-white ${isVisible ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
      
      <div className={`p-4 rounded-xl border transition-all duration-200 ${
        isVisible 
          ? 'bg-white border-slate-200 shadow-sm' 
          : 'bg-slate-50 border-dashed border-slate-300 opacity-70'
      }`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${severityStyle}`}>
              {entry.category}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isVisible && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-200 text-slate-600 border border-slate-300">
                HIDDEN FROM CITIZEN FEED
              </span>
            )}
          </div>
          
          <button
            onClick={() => onToggleVisibility(!isVisible)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
              isVisible 
                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-rose-600'
                : 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-700'
            }`}
            title={isVisible ? "Hide from public" : "Show to public"}
          >
            {isVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show</span>
              </>
            )}
          </button>
        </div>
        
        <p className={`text-sm mt-2 ${isVisible ? 'text-slate-800' : 'text-slate-500'}`}>
          {entry.formatted_entry}
        </p>
        
        <div className="mt-3 text-xs text-slate-400 font-mono">
          Ref ID: {entry.id} | Source: {entry.source_event_id}
        </div>
      </div>
    </div>
  );
};
