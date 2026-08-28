import React, { useEffect } from 'react';
import { useCommsStore } from './useCommsStore';
import { CommsMetricsBar } from './CommsMetricsBar';
import { TabCitizenAlerts } from './TabCitizenAlerts';
import { TabPressRelations } from './TabPressRelations';
import { TabTransparencyTimeline } from './TabTransparencyTimeline';
import { RadioTower, Megaphone, Newspaper, LayoutList } from 'lucide-react';

export const PublicCommunicationsModule: React.FC = () => {
  const { activeTab, setActiveTab, fetchInitialData } = useCommsStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Megaphone className="w-6 h-6 mr-3 text-[#0f2942]" />
            Public Communications & News Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage geofenced alerts, press releases, and transparency feeds.</p>
        </div>
        <div className="flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          COMMS DISPATCH ENGINE ACTIVE
        </div>
      </div>

      {/* Metrics Bar */}
      <CommsMetricsBar />

      {/* Tab Switcher */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 flex space-x-1 mb-6 shadow-sm inline-flex">
        <TabButton 
          isActive={activeTab === 'alerts'} 
          onClick={() => setActiveTab('alerts')}
          icon={<RadioTower className="w-4 h-4 mr-2" />}
          label="Citizen Alerts"
        />
        <TabButton 
          isActive={activeTab === 'press'} 
          onClick={() => setActiveTab('press')}
          icon={<Newspaper className="w-4 h-4 mr-2" />}
          label="Media & Press Relations"
        />
        <TabButton 
          isActive={activeTab === 'timeline'} 
          onClick={() => setActiveTab('timeline')}
          icon={<LayoutList className="w-4 h-4 mr-2" />}
          label="Transparency Timeline"
        />
      </div>

      {/* Active Tab Content */}
      <div className="flex-1">
        {activeTab === 'alerts' && <TabCitizenAlerts />}
        {activeTab === 'press' && <TabPressRelations />}
        {activeTab === 'timeline' && <TabTransparencyTimeline />}
      </div>

    </div>
  );
};

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ isActive, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-slate-900 text-white shadow-sm' 
          : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

export default PublicCommunicationsModule;
