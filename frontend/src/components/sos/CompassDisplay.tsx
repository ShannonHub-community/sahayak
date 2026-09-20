import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  Navigation2, 
  Compass, 
  Building2, 
  Radio,
  RefreshCw,
  Info
} from 'lucide-react';
import type { NearestShelter, SOSLocation } from '@/types/sos';
import type { MiniMapProps } from './MiniMap';
import { getOfflineHazards } from '@/services/offlineCache';

const MiniMap = dynamic<MiniMapProps>(
  () => import('./MiniMap').then((mod) => mod.MiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-80 bg-slate-200 border-2 border-gray-300 rounded-sm flex flex-col items-center justify-center gap-2 text-xs text-gray-600">
        <RefreshCw className="w-5 h-5 text-[#0B3D6E] animate-spin" />
        <span className="font-semibold font-mono">Loading Shelter Evacuation Route Map...</span>
      </div>
    ),
  }
);

export interface CompassDisplayProps {
  shelter: NearestShelter;
  citizenLocation?: SOSLocation | null;
  reportId: string;
  onReset: () => void;
}

export const CompassDisplay: React.FC<CompassDisplayProps> = ({
  shelter,
  citizenLocation,
  reportId,
  onReset,
}) => {
  // Live Device Orientation State
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [isLiveCompassActive, setIsLiveCompassActive] = useState<boolean>(false);
  const [orientationPermissionState, setOrientationPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [hazards, setHazards] = useState<Array<{ id: string; lat: number; lng: number; severity: string; category: string }>>([]);

  useEffect(() => {
    const cached = getOfflineHazards();
    if (cached && cached.length > 0) {
      const formatted = cached.map((item: any) => ({
        id: String(item.id || item.tracking_id || Math.random().toString(36).substring(2, 9)),
        lat: Number(item.lat ?? item.latitude ?? 0),
        lng: Number(item.lng ?? item.longitude ?? 0),
        severity: String(item.severity || 'medium'),
        category: String(item.category || item.damage_category || 'Hazard'),
      })).filter((h: any) => !isNaN(h.lat) && !isNaN(h.lng) && (h.lat !== 0 || h.lng !== 0));
      setHazards(formatted);
    }
  }, []);

  // Static calculated bearing from SOS dispatch
  const staticBearing = typeof shelter?.bearing === 'number' && !isNaN(shelter.bearing)
    ? ((shelter.bearing % 360) + 360) % 360
    : 0;

  // Relative needle angle: if live heading is active, calculate angle relative to device's current facing
  const activeNeedleRotation = deviceHeading !== null
    ? ((staticBearing - deviceHeading + 360) % 360)
    : staticBearing;

  // Target shelter coords
  const targetLat = shelter.coordinates?.lat ?? 18.9902;
  const targetLng = shelter.coordinates?.lng ?? 73.1276;

  // Effective citizen location: use submitted coords or Panvel disaster sector default
  const effectiveCitizenLocation: SOSLocation = citizenLocation || {
    lat: 18.9890,
    lng: 73.1200,
    accuracy: 5,
    isFallback: false,
  };

  // Device Orientation Listener Setup for live compass needle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // 1. iOS Safari compass heading (0 = True North)
      if (typeof (e as any).webkitCompassHeading === 'number') {
        heading = (e as any).webkitCompassHeading;
      } 
      // 2. Android / standard absolute orientation
      else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        setIsLiveCompassActive(true);
        setOrientationPermissionState('granted');
      }
    };

    // Auto-listen on standard browsers that don't require user-prompt permission
    if ('DeviceOrientationEvent' in window) {
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    } else {
      setOrientationPermissionState('unsupported');
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // iOS Safari / explicit user permission trigger
  const requestCompassPermission = async () => {
    if (typeof window === 'undefined') return;

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const res = await (DeviceOrientationEvent as any).requestPermission();
        if (res === 'granted') {
          setOrientationPermissionState('granted');
          window.addEventListener('deviceorientation', (e) => {
            if (typeof (e as any).webkitCompassHeading === 'number') {
              setDeviceHeading(Math.round((e as any).webkitCompassHeading));
              setIsLiveCompassActive(true);
            }
          });
        } else {
          setOrientationPermissionState('denied');
        }
      } catch (err) {
        console.warn('Orientation permission error:', err);
        setOrientationPermissionState('denied');
      }
    } else if ('DeviceOrientationEvent' in window) {
      // Android calibration trigger
      setIsLiveCompassActive(true);
      setOrientationPermissionState('granted');
    } else {
      setOrientationPermissionState('unsupported');
    }
  };

  return (
    <div className="w-full bg-white border-2 border-emerald-700 rounded-sm p-4 sm:p-6 shadow-md text-gray-900 space-y-5">
      {/* Official Confirmation Banner */}
      <div className="bg-emerald-50 border-b-2 border-emerald-600 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-700 flex-shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-emerald-950 leading-tight">
              SOS TRANSMITTED | आपातकालीन सूचना प्रेषित
            </h2>
            <p className="text-xs text-emerald-800">
              National Dispatch Reference: <span className="font-mono font-bold">{reportId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side: Compass Direction & Shelter Info ALONGSIDE the Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Shelter Direction Card & Live Compass */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Primary Shelter Guidance Info Panel */}
          <div className="bg-blue-50/70 border-2 border-[#0B3D6E] rounded-sm p-4 space-y-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#0B3D6E] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm">
                  NEAREST ASSIGNED RELIEF SHELTER
                </span>
                <span className="text-[11px] text-gray-500 font-semibold">
                  Panvel Grid
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B3D6E] tracking-tight">
                {shelter.name}
              </h3>

              {shelter.category && (
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  {shelter.category}
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60 text-xs">
              <div className="bg-white p-2.5 rounded border border-blue-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Distance</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="text-base sm:text-lg font-extrabold text-emerald-800 font-mono">
                    {shelter.distance}
                  </span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-blue-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Heading</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Compass className="w-4 h-4 text-[#0B3D6E] flex-shrink-0" />
                  <span className="text-base sm:text-lg font-extrabold text-[#0B3D6E] font-mono">
                    {shelter.cardinal} ({staticBearing !== undefined ? staticBearing.toFixed(2) : '0.00'}°)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live-Updating Compass Needle Card */}
          <div className="bg-white border-2 border-[#0B3D6E] p-4 rounded-sm text-center shadow-sm flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
              {isLiveCompassActive ? 'Live Sensor Compass' : 'Calculated Heading'}
            </div>

            {/* Compass Dial with Live-Rotating Needle */}
            <div className="relative w-20 h-20 rounded-full border-2 border-[#0B3D6E] bg-slate-50 flex items-center justify-center shadow-inner my-2">
              <span className="absolute top-1 text-[9px] font-bold text-red-600 select-none">N</span>
              <span className="absolute bottom-1 text-[9px] font-bold text-gray-400 select-none">S</span>
              <span className="absolute right-1.5 text-[9px] font-bold text-gray-400 select-none">E</span>
              <span className="absolute left-1.5 text-[9px] font-bold text-gray-400 select-none">W</span>

              {/* Live Rotated Direction Arrow */}
              <div
                className="w-full h-full absolute flex items-center justify-center transition-transform duration-200 ease-out pointer-events-none"
                style={{ transform: `rotate(${activeNeedleRotation}deg)` }}
                aria-label={`Compass needle pointing at ${activeNeedleRotation} degrees relative to device`}
              >
                <Navigation2 className="w-8 h-8 text-[#D32F2F] fill-[#D32F2F] filter drop-shadow" />
              </div>

              <div className="w-3 h-3 rounded-full bg-[#0B3D6E] border-2 border-white z-10" />
            </div>

            {/* Compass Heading Readout */}
            <div className="text-xs font-mono font-bold text-[#0B3D6E]">
              Direction: {shelter.cardinal} ({staticBearing !== undefined ? staticBearing.toFixed(2) : '0.00'}°)
            </div>

            {isLiveCompassActive ? (
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Live tracking (Device facing {typeof deviceHeading === 'number' ? deviceHeading.toFixed(1) : '0'}°N)</span>
              </div>
            ) : (
              <div className="space-y-1 mt-1.5">
                <span className="text-[10px] text-gray-500 block leading-tight">
                  Live orientation inactive — showing static heading.
                </span>
                <button
                  type="button"
                  onClick={requestCompassPermission}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 underline block mx-auto"
                >
                  Enable Live Device Compass
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Shared MiniMap showing Citizen Pin & Nearest Shelter Pin */}
        <div className="lg:col-span-7 flex flex-col">
          <MiniMap
            mode="route"
            readOnly={true}
            location={effectiveCitizenLocation}
            hazards={hazards}
            shelterLocation={{
              lat: targetLat,
              lng: targetLng,
              name: shelter.name,
              distance: shelter.distance,
              cardinal: shelter.cardinal,
              bearing: staticBearing,
              category: shelter.category,
            }}
            label={`Disaster Evacuation Map: You → ${shelter.name}`}
            className="w-full h-full min-h-[340px] sm:min-h-[380px] shadow-sm"
          />
        </div>
      </div>

      {/* Safety Instructions & Movement Protocol */}
      <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-sm text-xs text-amber-950 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Disaster Movement Protocol / आपदा राहत निर्देश:</span>
        </div>
        <p className="pl-5 text-gray-800">
          1. Proceed in the <strong>{shelter.cardinal} ({staticBearing !== undefined ? staticBearing.toFixed(2) : '0.00'}°)</strong> direction towards <strong>{shelter.name}</strong> ({shelter.distance}). Refer to the route line and pins on the map above.
        </p>
        <p className="pl-5 text-gray-800">
          2. Avoid walking or driving through moving flood waters. Conserve phone battery.
        </p>
        <p className="pl-5 text-gray-800">
          3. First responders and local NDRF/SDRF rescue teams in Panvel have received your exact GPS coordinates.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <a
          href="tel:112"
          className="flex-1 min-h-[44px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-sm py-3 px-4 rounded-sm flex items-center justify-center gap-2 border border-red-700 text-center transition-colors shadow-sm"
        >
          <Phone className="w-4 h-4" />
          <span>Call 112 Control Room</span>
        </a>

        <Link
          href="/citizen/guides"
          className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm py-3 px-4 rounded-sm flex items-center justify-center gap-2 border border-emerald-700 text-center transition-colors shadow-sm"
        >
          <Radio className="w-4 h-4" />
          <span>Open Offline Survival Protocols</span>
        </Link>

        <button
          type="button"
          onClick={onReset}
          className="flex-1 min-h-[44px] bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 font-semibold text-sm py-3 px-4 rounded-sm border border-gray-400 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Submit Another SOS / Return</span>
        </button>
      </div>
    </div>
  );
};
