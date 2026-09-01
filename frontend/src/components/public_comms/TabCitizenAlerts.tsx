"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCommsStore } from './useCommsStore';
import { AlertCircle, Send, MapPin, Users, Waves, ChevronRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapContainer = dynamic<any>(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TileLayer = dynamic<any>(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Circle = dynamic<any>(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Popup = dynamic<any>(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export const TabCitizenAlerts: React.FC = () => {
  const { 
    zones, 
    selectedZoneId, 
    setSelectedZoneId,
    isDraftingSMS,
    smsDraft,
    setSmsDraft,
    broadcastSMS
  } = useCommsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fix Leaflet marker icon issues in Next.js
    if (typeof window !== 'undefined') {
      // @ts-expect-error - missing @types/leaflet
      import('leaflet').then((L) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  const selectedZone = zones.find(z => z.zone_id === selectedZoneId);

  const handleBroadcastConfirm = () => {
    broadcastSMS();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      
      {/* Map Panel */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col relative">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center z-10">
          <div>
            <h3 className="font-semibold text-slate-800">Geofence Selection</h3>
            <p className="text-xs text-slate-500 mt-1">Select a risk zone to target broadcasts</p>
          </div>
          {selectedZone && (
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-slate-700">{selectedZone.zone_name}</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={[18.9920, 73.1200]} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {zones.map(zone => (
              <Circle 
                key={zone.zone_id} 
                center={zone.coordinates}
                radius={zone.radius_m}
                pathOptions={{ 
                  color: selectedZoneId === zone.zone_id ? '#0284c7' : '#0ea5e9', 
                  fillColor: '#0ea5e9', 
                  fillOpacity: 0.4,
                  weight: selectedZoneId === zone.zone_id ? 3 : 1
                }}
                eventHandlers={{
                  click: () => setSelectedZoneId(zone.zone_id),
                }}
              >
                <Popup>
                  <div className="font-semibold">{zone.zone_name}</div>
                  <div className="text-sm text-slate-600">Click to select for broadcast.</div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Drafting Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white rounded-t-xl">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold tracking-wide">AI SMS DRAFTING</h3>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {!selectedZone ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
              <MapPin className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="text-slate-600 font-medium mb-1">No Zone Selected</h4>
              <p className="text-sm text-slate-400">Click on a map marker to select a target geofence.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              
              {/* Zone Metadata */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-800">{selectedZone.zone_name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    selectedZone.evacuation_status === 'Mandatory' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    selectedZone.evacuation_status === 'Advisory' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedZone.evacuation_status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Waves className="w-4 h-4 text-blue-500" />
                    <span>{selectedZone.flood_depth_m}m Level</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-rose-500" />
                    <span>{selectedZone.active_sos_count} SOS</span>
                  </div>
                </div>
              </div>

              {/* Drafting Area */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message Draft</label>
                  <span className={`text-xs ${smsDraft.length > 160 ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                    {smsDraft.length}/160 chars
                  </span>
                </div>
                
                <textarea
                  className="w-full flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0f2942] focus:border-[#0f2942] resize-none text-sm text-slate-700"
                  placeholder="Click 'Generate AI Warning Draft' or type manually..."
                  value={smsDraft}
                  onChange={(e) => setSmsDraft(e.target.value)}
                  disabled={isDraftingSMS}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col space-y-3 mt-auto">
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={!smsDraft || isDraftingSMS}
                  className="flex items-center justify-between w-full py-2.5 px-4 bg-[#0f2942] hover:bg-[#1a3a5a] text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Broadcast to Geofence</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm SMS Broadcast"
        message={`This action will trigger an SMS broadcast to all cellular towers in ${selectedZone?.zone_name}. This cannot be undone.`}
        confirmText="Broadcast SMS"
        onConfirm={handleBroadcastConfirm}
        onCancel={() => setIsModalOpen(false)}
      />

    </div>
  );
};
