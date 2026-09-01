import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  Navigation2, 
  Compass, 
  Building2, 
  AlertCircle,
  WifiOff,
  Radio,
  RefreshCw
} from 'lucide-react';
import type { NearestShelter } from '@/types/sos';
import { PANVEL_SAMPLE_SHELTERS } from '@/constants/sampleShelters';

interface CompassDisplayProps {
  shelter: NearestShelter;
  reportId: string;
  onReset: () => void;
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster' as const,
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const CompassDisplay: React.FC<CompassDisplayProps> = ({
  shelter,
  reportId,
  onReset,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Live Device Orientation State
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [isLiveCompassActive, setIsLiveCompassActive] = useState<boolean>(false);
  const [orientationPermissionState, setOrientationPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

  // Static calculated bearing from SOS dispatch
  const staticBearing = ((shelter.bearing % 360) + 360) % 360;

  // Relative needle angle: if live heading is active, calculate angle relative to device's current facing
  const activeNeedleRotation = deviceHeading !== null
    ? ((staticBearing - deviceHeading + 360) % 360)
    : staticBearing;

  // Target shelter coords
  const targetLat = shelter.coordinates?.lat ?? 18.9902;
  const targetLng = shelter.coordinates?.lng ?? 73.1276;

  // Network check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Device Orientation Listener Setup
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
        if ((e as any).absolute) {
          heading = (360 - e.alpha) % 360;
        } else {
          heading = (360 - e.alpha) % 360;
        }
      }

      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        setIsLiveCompassActive(true);
        setOrientationPermissionState('granted');
      }
    };

    // Auto-listen on non-iOS or standard browsers
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

  // Initialize MapLibre with built-in NavigationControl compass and FullscreenControl
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return;
      }

      try {
        const maplibregl = await import('maplibre-gl');

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: [targetLng, targetLat],
          zoom: 14,
          attributionControl: false,
        });

        // Built-in MapLibre NavigationControl with native compass on top-right of the map
        const navControl = new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        });
        map.addControl(navControl, 'top-right');

        // Built-in MapLibre FullscreenControl for expandable shelter map
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');

        map.on('resize', () => {
          map.resize();
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapLoaded(true);

          // Add markers for all Panvel sample shelters
          PANVEL_SAMPLE_SHELTERS.forEach((item) => {
            const isAssigned = item.name.toLowerCase().includes(shelter.name.toLowerCase()) ||
              shelter.name.toLowerCase().includes(item.name.toLowerCase());

            const el = document.createElement('div');
            el.className = isAssigned ? 'assigned-shelter-marker' : 'other-shelter-marker';
            el.innerHTML = `<div style="width: 28px; height: 28px; border-radius: 50%; background: ${isAssigned ? '#16A34A' : '#0B3D6E'}; border: 3px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">${isAssigned ? '★' : 'H'}</div>`;

            const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`
              <div style="font-family: sans-serif; padding: 4px;">
                <div style="font-weight: bold; font-size: 12px; color: ${isAssigned ? '#166534' : '#0B3D6E'};">
                  ${item.name} ${isAssigned ? '(Assigned Shelter)' : ''}
                </div>
                <div style="font-size: 11px; color: #4B5563; margin-top: 2px;">${item.category}</div>
                <div style="font-size: 10px; color: #6B7280; margin-top: 2px;">Cap: ${item.capacityPax} PAX</div>
              </div>
            `);

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([item.lng, item.lat])
              .setPopup(popup)
              .addTo(map);

            if (isAssigned) {
              marker.togglePopup();
            }

            markersRef.current.push(marker);
          });
        });

        map.on('error', (e) => {
          console.warn('MapLibre error on shelter map:', e);
          if (!navigator.onLine) {
            setMapError('Map tile server unavailable offline');
          }
        });
      } catch (err: any) {
        console.error('Failed to initialize shelter map:', err);
        if (isMounted) {
          setMapError('Map display unavailable offline. Bearing details remain active.');
        }
      }
    }

    if (isOnline) {
      initMap();
    }

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOnline, targetLat, targetLng, shelter.name]);

  const isMapOffline = !isOnline || Boolean(mapError);

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

      {/* Primary Shelter Guidance Info Panel (Attached directly to map) */}
      <div className="bg-blue-50/70 border-2 border-[#0B3D6E] rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#0B3D6E] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm">
              NEAREST ASSIGNED RELIEF SHELTER (PANVEL)
            </span>
            <span className="text-xs text-gray-500 font-semibold">
              District Disaster Network
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B3D6E] tracking-tight">
            {shelter.name}
          </h3>

          <div className="text-xs text-gray-700 flex flex-wrap items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Distance: <strong className="text-emerald-800 text-sm">{shelter.distance}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono font-bold text-[#0B3D6E]">
              <Compass className="w-3.5 h-3.5 text-[#0B3D6E]" />
              <span>Disaster Heading: {shelter.cardinal} ({staticBearing}°)</span>
            </span>
          </div>
        </div>

        {/* Live-Updating Compass Needle Card */}
        <div className="bg-white border-2 border-[#0B3D6E] p-3 rounded-sm text-center shadow-sm w-full sm:w-auto flex flex-col items-center justify-center min-w-[190px]">
          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
            {isLiveCompassActive ? 'Live Shelter Compass' : 'Calculated Direction'}
          </div>

          {/* Compass Dial with Live-Rotating Needle */}
          <div className="relative w-16 h-16 rounded-full border-2 border-[#0B3D6E] bg-slate-50 flex items-center justify-center shadow-inner my-1">
            <span className="absolute top-0.5 text-[8px] font-bold text-red-600 select-none">N</span>
            <span className="absolute bottom-0.5 text-[8px] font-bold text-gray-400 select-none">S</span>
            <span className="absolute right-1 text-[8px] font-bold text-gray-400 select-none">E</span>
            <span className="absolute left-1 text-[8px] font-bold text-gray-400 select-none">W</span>

            {/* Live Rotated Direction Arrow */}
            <div
              className="w-full h-full absolute flex items-center justify-center transition-transform duration-200 ease-out pointer-events-none"
              style={{ transform: `rotate(${activeNeedleRotation}deg)` }}
              aria-label={`Compass needle pointing at ${activeNeedleRotation} degrees relative to device`}
            >
              <Navigation2 className="w-7 h-7 text-[#D32F2F] fill-[#D32F2F] filter drop-shadow" />
            </div>

            <div className="w-2.5 h-2.5 rounded-full bg-[#0B3D6E] border border-white z-10" />
          </div>

          {/* Compass Status Readout */}
          <div className="text-[11px] font-mono font-bold text-[#0B3D6E] mt-1">
            {shelter.cardinal} ({staticBearing}°)
          </div>

          {isLiveCompassActive ? (
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Live tracking (Facing {deviceHeading}°N)</span>
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              <span className="text-[10px] text-gray-500 block leading-tight">
                Live compass unavailable on this device — showing fixed direction.
              </span>
              <button
                type="button"
                onClick={requestCompassPermission}
                className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline block mx-auto"
              >
                Enable Live Sensor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real MapLibre Interactive Map Canvas with Built-In Compass and Fullscreen Control */}
      <div className="relative border-2 border-gray-300 rounded-sm overflow-hidden bg-gray-100">
        <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0B3D6E]" />
            <span>Panvel Emergency Shelter Network (Map Compass & Fullscreen Enabled)</span>
          </div>
          <span className="text-[11px] text-gray-500">
            ★ Green = Assigned | Blue = Alternate Shelters
          </span>
        </div>

        {isMapOffline ? (
          <div className="w-full h-56 sm:h-72 bg-slate-900 text-white p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 uppercase">
                  Map Tiles Offline — Shelter Coordinates:
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                OFFLINE BEARING ACTIVE
              </span>
            </div>

            <div className="my-auto text-center space-y-2">
              <div className="text-lg font-bold text-emerald-400">
                Target: {shelter.name}
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
                {shelter.distance} • {shelter.cardinal} ({staticBearing}°)
              </div>
              <p className="text-xs text-slate-300">
                Coordinates: {targetLat.toFixed(4)}° N, {targetLng.toFixed(4)}° E
              </p>
            </div>

            <div className="text-xs text-slate-400 text-center border-t border-slate-700/80 pt-2">
              Follow heading {shelter.cardinal} ({staticBearing}°) towards designated high-ground shelter.
            </div>
          </div>
        ) : (
          <div className="relative w-full h-56 sm:h-72 bg-slate-200">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              tabIndex={0}
              aria-label="Panvel Emergency Shelter Network Map"
            />

            {!mapLoaded && (
              <div className="absolute inset-0 bg-slate-200 flex flex-col items-center justify-center gap-2 text-xs text-gray-700 animate-pulse select-none">
                <RefreshCw className="w-5 h-5 text-[#0B3D6E] animate-spin" />
                <span className="font-semibold font-mono">Loading Shelter Network Map...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Instructions & Protocol */}
      <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-sm text-xs text-amber-950 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Disaster Movement Protocol / आपदा राहत निर्देश:</span>
        </div>
        <p className="pl-5 text-gray-800">
          1. Head in the <strong>{shelter.cardinal} ({staticBearing}°)</strong> direction towards <strong>{shelter.name}</strong>. Orient yourself using the live compass needle or the top-right map compass.
        </p>
        <p className="pl-5 text-gray-800">
          2. Avoid walking or driving through moving flood water. Conserve phone battery.
        </p>
        <p className="pl-5 text-gray-800">
          3. First responders and local NDRF/SDRF teams in Panvel have received your coordinates.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <a
          href="tel:112"
          className="flex-1 min-h-[44px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-sm py-3 px-4 rounded-sm flex items-center justify-center gap-2 border border-red-700 text-center transition-colors shadow-sm"
        >
          <Phone className="w-4 h-4" />
          <span>Call 112 Control Room</span>
        </a>

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
