import React, { useState } from 'react';
import { User, MapPin, Briefcase, Plus, X, Info, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CitizenLocation } from '@/types/registration';
import type { SOSLocation } from '@/types/sos';

import type { MiniMapProps } from '@/components/sos/MiniMap';

const MiniMap = dynamic<MiniMapProps>(
  () => import('@/components/sos/MiniMap').then((mod) => mod.MiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-slate-200 border-2 border-gray-300 rounded-sm flex items-center justify-center text-xs text-gray-600">
        Loading Pin-Drop Map...
      </div>
    ),
  }
);


interface StepBasicProfileProps {
  name: string;
  onNameChange: (val: string) => void;
  age: number | '';
  onAgeChange: (val: number | '') => void;
  gender: string;
  onGenderChange: (val: string) => void;
  homeLocation: CitizenLocation;
  onHomeLocationChange: (loc: CitizenLocation) => void;
  isHomeLocationFallback?: boolean;
  workLocation: CitizenLocation | null;
  onWorkLocationChange: (loc: CitizenLocation | null) => void;
  error?: string | null;
}

export const StepBasicProfile: React.FC<StepBasicProfileProps> = ({
  name,
  onNameChange,
  age,
  onAgeChange,
  gender,
  onGenderChange,
  homeLocation,
  onHomeLocationChange,
  isHomeLocationFallback = false,
  workLocation,
  onWorkLocationChange,
  error,
}) => {
  const [showWorkLocation, setShowWorkLocation] = useState<boolean>(Boolean(workLocation));

  // Convert CitizenLocation to SOSLocation format for MiniMap
  const homeSosLocation: SOSLocation = {
    lat: homeLocation.lat,
    lng: homeLocation.lng,
    accuracy: isHomeLocationFallback ? undefined : 5,
    isFallback: isHomeLocationFallback,
  };

  const workSosLocation: SOSLocation | null = workLocation
    ? {
        lat: workLocation.lat,
        lng: workLocation.lng,
        accuracy: 5,
        isFallback: false,
      }
    : null;

  const handleToggleWorkLocation = (enable: boolean) => {
    setShowWorkLocation(enable);
    if (!enable) {
      onWorkLocationChange(null);
    } else {
      // Default to slight offset from home for easy identification
      onWorkLocationChange({
        lat: Number((homeLocation.lat + 0.015).toFixed(6)),
        lng: Number((homeLocation.lng + 0.015).toFixed(6)),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Guidance */}
      <div className="bg-blue-50 border-l-4 border-[#0B3D6E] p-3.5 rounded-r-sm text-xs text-blue-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#0B3D6E] flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-gray-900">Demographic & Geo-Tagging Information</div>
          <div className="text-gray-700 mt-0.5">
            Your home and workplace coordinates allow automated emergency response systems to route you to the nearest designated cyclone/flood shelter even when offline.
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 p-3 rounded-sm text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Personal Demographics */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <User className="w-4 h-4 text-[#0B3D6E]" />
          <h3 className="text-sm font-bold text-gray-900 uppercase">
            2.1 Personal Details / व्यक्तिगत विवरण
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-800 mb-1">
              Full Legal Name / पूरा नाम <span className="text-red-600">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 focus:border-[#0B3D6E] rounded-sm text-gray-900 bg-white"
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="reg-age" className="block text-xs font-semibold text-gray-800 mb-1">
              Age (Years) / आयु <span className="text-red-600">*</span>
            </label>
            <input
              id="reg-age"
              type="number"
              min={1}
              max={120}
              required
              value={age === '' ? '' : age}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                onAgeChange(val);
              }}
              placeholder="e.g. 34"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 focus:border-[#0B3D6E] rounded-sm text-gray-900 bg-white font-mono"
            />
          </div>
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            Gender / लिंग <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['Male', 'Female', 'Transgender', 'Other'].map((g) => (
              <label
                key={g}
                className={`flex items-center gap-2 p-2.5 border rounded-sm cursor-pointer select-none text-xs transition-colors ${
                  gender === g
                    ? 'bg-blue-50 border-[#0B3D6E] text-[#0B3D6E] font-bold shadow-sm'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="reg-gender"
                  value={g}
                  checked={gender === g}
                  onChange={() => onGenderChange(g)}
                  className="w-3.5 h-3.5 text-[#0B3D6E] focus:ring-[#0B3D6E]"
                />
                <span>{g}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: Home Location Pinning */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              2.2 Home / Primary Residence Location / निवास स्थान <span className="text-red-600">*</span>
            </h3>
          </div>
          <span className="text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
            {homeLocation.lat.toFixed(4)}°N, {homeLocation.lng.toFixed(4)}°E
          </span>
        </div>

        <p className="text-xs text-gray-600">
          Tap or drag the red pin on the map to mark your permanent home location.
        </p>

        <MiniMap
          mode="pick"
          location={homeSosLocation}
          onLocationChange={(loc) => {
            onHomeLocationChange({ lat: loc.lat, lng: loc.lng });
          }}
          label="Home Residence (Tap to Reposition Pin)"
        />
      </div>

      {/* SECTION 3: Workplace Location (Optional) */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#0B3D6E]" />
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              2.3 Workplace / Office Location / कार्यस्थल (Optional)
            </h3>
          </div>

          {!showWorkLocation ? (
            <button
              type="button"
              onClick={() => handleToggleWorkLocation(true)}
              className="text-xs font-semibold text-[#0B3D6E] hover:text-blue-900 flex items-center gap-1 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Workplace</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleWorkLocation(false)}
              className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 border border-red-200 bg-red-50 px-2.5 py-1 rounded-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {showWorkLocation ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-gray-600">
              Tap to pin your workplace. This helps provide localized daytime disaster alert routes.
            </p>

            <MiniMap
              mode="pick"
              location={workSosLocation || homeSosLocation}
              onLocationChange={(loc) => {
                onWorkLocationChange({ lat: loc.lat, lng: loc.lng });
              }}
              label="Workplace / Office (Tap to Pin)"
            />
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">
            No workplace location added. You can optionally add one if you commute daily.
          </p>
        )}
      </div>
    </div>
  );
};
