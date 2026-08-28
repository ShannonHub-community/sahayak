import React from 'react';
import { useCommsStore } from './useCommsStore';
import { Activity, Radio, FileText, Clock, ShieldAlert } from 'lucide-react';

export const CommsMetricsBar: React.FC = () => {
  const { metrics, smsAlerts, pressReleases, timelineEntries } = useCommsStore();

  const activeBroadcasts = smsAlerts.length; // Local session broadcasts
  const totalSMS = metrics ? metrics.active_incidents * 15420 : 0; // Simulated scale from metrics
  const activePressReleases = pressReleases.length;
  const publicTimelineItems = timelineEntries.filter(e => e.public_visible).length;
  const networkHealth = metrics ? metrics.comms_network_health : 100;
  
  if (!metrics) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <MetricCard 
        title="COMMS NETWORK" 
        value={`${networkHealth}%`} 
        badge={networkHealth > 90 ? "OPTIMAL" : "DEGRADED"} 
        badgeColor={networkHealth > 90 ? "emerald" : "amber"}
        icon={<Activity className="w-5 h-5 text-emerald-600" />}
      />
      <MetricCard 
        title="ACTIVE BROADCASTS" 
        value={activeBroadcasts.toString()} 
        badge={activeBroadcasts > 0 ? "WARNING" : "STANDBY"} 
        badgeColor={activeBroadcasts > 0 ? "amber" : "slate"}
        icon={<Radio className="w-5 h-5 text-amber-600" />}
      />
      <MetricCard 
        title="CITIZEN SMS SENT" 
        value={totalSMS.toLocaleString()} 
        badge="DELIVERED" 
        badgeColor="emerald"
        icon={<ShieldAlert className="w-5 h-5 text-slate-600" />}
      />
      <MetricCard 
        title="PRESS RELEASES" 
        value={activePressReleases.toString()} 
        badge="PUBLISHED" 
        badgeColor="emerald"
        icon={<FileText className="w-5 h-5 text-blue-600" />}
      />
      <MetricCard 
        title="PUBLIC TIMELINE" 
        value={publicTimelineItems.toString()} 
        badge="LIVE" 
        badgeColor="emerald"
        icon={<Clock className="w-5 h-5 text-indigo-600" />}
      />
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, badge, badgeColor, icon }) => {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-semibold text-slate-500 tracking-wider uppercase">{title}</h3>
        {icon}
      </div>
      <div className="flex items-end justify-between mt-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${colorStyles[badgeColor]}`}>
          {badge}
        </span>
      </div>
    </div>
  );
};
