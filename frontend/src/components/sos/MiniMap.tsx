import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, AlertCircle, CheckCircle2, RefreshCw, MapPin, WifiOff, X } from 'lucide-react';
import type { SOSLocation } from '@/types/sos';
import { getRealCoordinates } from '@/services/geolocation';

export interface MiniMapProps {
  mode?: 'live' | 'pick';
  location: SOSLocation | null;
  onLocationChange?: (loc: SOSLocation) => void;
  onRefreshLocation?: () => void;
  isLoadingLocation?: boolean;
  locationError?: string | null;
  className?: string;
  label?: string;
}

// OpenStreetMap Raster Style Specification (zero external API keys, 100% reliable)
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
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

// Wide national overview center (camera viewpoint ONLY when location has not been acquired yet — NO marker placed)
const INITIAL_OVERVIEW_CENTER = { lat: 20.5937, lng: 78.9629 };

/**
 * Creates high-contrast, fully visible marker DOM elements for MapLibre.
 * Live mode: pulsating blue GPS beacon ring and center dot.
 * Pick mode: bright red map pin with drop shadow.
 */
function renderMarkerContent(el: HTMLElement, mode: 'live' | 'pick') {
  if (mode === 'live') {
    el.className = 'live-gps-marker';
    el.style.cursor = 'default';
    el.innerHTML = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(11, 61, 110, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background-color: #0B3D6E; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45);"></div>
      </div>
    `;
  } else {
    el.className = 'pin-selection-marker';
    el.style.cursor = 'grab';
    el.innerHTML = `
      <div style="position: relative; width: 36px; height: 40px; display: flex; align-items: center; justify-content: center; transform: translate(0, -14px);">
        <svg width="34" height="38" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="#DC2626"/>
          <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
        </svg>
      </div>
    `;
  }
}

export const MiniMap: React.FC<MiniMapProps> = ({
  mode = 'live',
  location,
  onLocationChange,
  onRefreshLocation,
  isLoadingLocation = false,
  locationError = null,
  className = '',
  label,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const maplibreglRef = useRef<any>(null);
  const latestLocationRef = useRef<SOSLocation | null>(location);
  latestLocationRef.current = location;

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocatingSelf, setIsLocatingSelf] = useState<boolean>(false);
  const [internalLocationError, setInternalLocationError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const activeLocationError = locationError || internalLocationError;
  const isCurrentlyLocating = isLoadingLocation || isLocatingSelf;

  // Monitor network status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        setMapError(null);
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Helper to attach or update marker
  const syncMarker = (mapInstance: MapLibreMap, targetLng: number, targetLat: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([targetLng, targetLat]);
      return;
    }

    const MarkerConstructor = maplibreglRef.current?.Marker || (window as any).maplibregl?.Marker;
    if (!MarkerConstructor) {
      return;
    }

    const el = document.createElement('div');
    renderMarkerContent(el, mode);

    const marker = new MarkerConstructor({
      element: el,
      draggable: mode === 'pick',
    })
      .setLngLat([targetLng, targetLat])
      .addTo(mapInstance);

    if (mode === 'pick') {
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setInternalLocationError(null);
        if (onLocationChange) {
          onLocationChange({
            lat: Number(lngLat.lat.toFixed(6)),
            lng: Number(lngLat.lng.toFixed(6)),
            accuracy: 5,
            isFallback: false,
          });
        }
      });
    }

    markerRef.current = marker;
  };

  // Helper to apply real coordinates to THIS map instance (center + marker)
  const applyLocationToMap = (targetLng: number, targetLat: number, shouldFly: boolean = false) => {
    if (!mapRef.current) return;

    syncMarker(mapRef.current, targetLng, targetLat);
    mapRef.current.resize();

    if (shouldFly && mapLoaded) {
      mapRef.current.flyTo({
        center: [targetLng, targetLat],
        zoom: 15,
        essential: true,
        duration: 800,
      });
    } else {
      mapRef.current.setCenter([targetLng, targetLat]);
      mapRef.current.setZoom(15);
    }
  };

  // Unified GPS acquisition trigger used by both mode="live" and mode="pick"
  const handleAcquireCurrentLocation = async () => {
    if (typeof window === 'undefined') return;

    if (mode === 'pick') {
      console.log('pick mode: use current location clicked');
    }

    // In live mode with parent refresh callback, delegate directly
    if (mode === 'live' && onRefreshLocation) {
      onRefreshLocation();
      return;
    }

    setIsLocatingSelf(true);
    setInternalLocationError(null);

    try {
      // 1. Fetch real GPS coordinates using shared authoritative function
      const coords = await getRealCoordinates();
      if (mode === 'pick') {
        console.log('pick mode: got coordinates', coords.lat, coords.lng);
      }
      setIsLocatingSelf(false);
      setInternalLocationError(null);

      // 2. Immediately apply to THIS map instance (center map + drop marker)
      applyLocationToMap(coords.lng, coords.lat, true);

      // 3. Notify parent of new coordinates
      if (onLocationChange) {
        onLocationChange({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          isFallback: false,
        });
      }
    } catch (err: any) {
      setIsLocatingSelf(false);
      const errorMsg = err?.message || 'Location unavailable.';
      setInternalLocationError(errorMsg);
    }
  };

  // Initialize MapLibre instance once when online
  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return;
      }

      try {
        const maplibregl = await import('maplibre-gl');
        maplibreglRef.current = maplibregl;
        (window as any).maplibregl = maplibregl;

        const activeLoc = latestLocationRef.current;
        const hasRealLocation = activeLoc && !activeLoc.isFallback;
        const initialLat = hasRealLocation ? activeLoc.lat : INITIAL_OVERVIEW_CENTER.lat;
        const initialLng = hasRealLocation ? activeLoc.lng : INITIAL_OVERVIEW_CENTER.lng;
        const initialZoom = hasRealLocation ? 15 : 4.5;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: [initialLng, initialLat],
          zoom: initialZoom,
          attributionControl: false,
        });

        mapRef.current = map;

        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) {
              mapRef.current.resize();
            }
          });
          resizeObserver.observe(mapContainerRef.current);
        }

        map.addControl(
          new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }),
          'top-right'
        );
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');

        map.on('load', () => {
          if (!isMounted) return;
          map.resize();
          setMapLoaded(true);
          setMapError(null);

          const currentLoc = latestLocationRef.current;
          if (currentLoc && !currentLoc.isFallback) {
            // Place marker and center strictly at real location
            applyLocationToMap(currentLoc.lng, currentLoc.lat, false);
          }
        });

        // Click handler for mode="pick" (manual tap-to-pin)
        map.on('click', (e) => {
          if (mode === 'pick' && onLocationChange) {
            const { lng, lat } = e.lngLat;
            setInternalLocationError(null);
            const newLat = Number(lat.toFixed(6));
            const newLng = Number(lng.toFixed(6));

            syncMarker(map, newLng, newLat);

            onLocationChange({
              lat: newLat,
              lng: newLng,
              accuracy: 5,
              isFallback: false,
            });
          }
        });

        map.on('error', (e) => {
          console.warn('MapLibre map error:', e);
          if (!navigator.onLine) {
            setMapError('Map tile server unavailable offline');
          }
        });
      } catch (err: any) {
        console.error('Failed to initialize MapLibre GL:', err);
        if (isMounted) {
          setMapError('Map display unavailable offline. Raw GPS coordinates captured.');
        }
      }
    }

    if (isOnline) {
      initMap();
    }

    return () => {
      isMounted = false;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOnline]);

  // Update marker position and map center when location prop changes
  useEffect(() => {
    latestLocationRef.current = location;
    if (!mapRef.current) return;

    // If location is null or marked fallback, remove marker and do not show pin
    if (!location || location.isFallback) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    applyLocationToMap(location.lng, location.lat, mapLoaded);
  }, [location?.lat, location?.lng, location?.isFallback, mapLoaded, mode]);

  // Update marker styling and draggability when mode changes
  useEffect(() => {
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        renderMarkerContent(el, mode);
      }
      markerRef.current.setDraggable(mode === 'pick');
    }
  }, [mode]);

  const isMapOffline = !isOnline || Boolean(mapError);

  return (
    <div className={`relative border-2 border-gray-300 rounded-sm overflow-hidden bg-gray-100 ${className}`}>
      {label && (
        <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0B3D6E]" />
            <span>{label}</span>
          </div>
          {isMapOffline && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              <span>OFFLINE GPS ACTIVE</span>
            </span>
          )}
        </div>
      )}

      {/* Visible Actionable Geolocation Error Banner */}
      {activeLocationError && (
        <div className="bg-amber-50 border-b-2 border-amber-400 p-2.5 sm:p-3 text-xs text-amber-950 flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Location Notice: </span>
              {activeLocationError}
            </div>
          </div>
          {internalLocationError && (
            <button
              type="button"
              onClick={() => setInternalLocationError(null)}
              className="text-amber-800 hover:text-amber-950 p-0.5 rounded hover:bg-amber-100 flex-shrink-0"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 1. OFFLINE VIEW: Raw GPS coordinates display when map cannot render */}
      {isMapOffline ? (
        <div className="w-full h-48 sm:h-56 bg-slate-900 text-white p-4 sm:p-5 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Map unavailable offline — your location:
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              GPS SATELLITE LOCK
            </span>
          </div>

          <div className="my-auto py-2 text-center">
            {location && !location.isFallback ? (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 tracking-wider">
                  {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
                </div>
                <div className="text-xs text-slate-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Captured with ±{location.accuracy ? Math.round(location.accuracy) : 5}m device precision
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-amber-300">
                {isCurrentlyLocating
                  ? 'Getting your location from GPS / Network...'
                  : 'GPS location unavailable. Tap below to acquire coordinates.'}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/80 pt-2">
            <span className="text-[11px] text-slate-400">
              Coordinates will be encoded into automated emergency SMS dispatch.
            </span>

            <button
              type="button"
              onClick={handleAcquireCurrentLocation}
              disabled={isCurrentlyLocating}
              className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-blue-400/30 shadow flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {isCurrentlyLocating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* 2. ONLINE VIEW: MapLibre Interactive Map Canvas */
        <>
          <div className="relative w-full h-48 sm:h-56 bg-slate-200">
            <div
              ref={mapContainerRef}
              className={`w-full h-full ${mode === 'pick' ? 'cursor-crosshair' : ''}`}
              tabIndex={0}
              aria-label={label || 'Location Map'}
            />

            {/* Map Loading Skeleton / Spinner */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-slate-200 flex flex-col items-center justify-center gap-2 text-xs text-gray-700 animate-pulse select-none">
                <RefreshCw className="w-5 h-5 text-[#0B3D6E] animate-spin" />
                <span className="font-semibold font-mono">Initializing National Grid Map...</span>
              </div>
            )}
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Coordinates / Status Pill */}
            <div className="bg-white/95 backdrop-blur-none border border-gray-300 shadow-sm px-2.5 py-1 rounded text-[11px] font-mono pointer-events-auto flex items-center gap-1.5 text-gray-800">
              {isCurrentlyLocating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#0B3D6E] animate-spin" />
                  <span className="text-[#0B3D6E] font-semibold">Getting your location...</span>
                </>
              ) : activeLocationError && !location ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold text-amber-800">Location unavailable</span>
                </>
              ) : !location || location.isFallback ? (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold text-amber-800">
                    {mode === 'pick' ? 'Tap map to pin location' : 'Location unavailable'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    {`${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`}
                  </span>
                  {location.accuracy && (
                    <span className="text-[10px] text-gray-500 font-sans">
                      (±{Math.round(location.accuracy)}m)
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Unified Action Button for both live and pick modes */}
            {(onRefreshLocation || onLocationChange) && (
              <button
                type="button"
                onClick={handleAcquireCurrentLocation}
                disabled={isCurrentlyLocating}
                className="pointer-events-auto bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-blue-900 shadow flex items-center gap-1.5 transition-colors disabled:opacity-60"
                title="Acquire current GPS position"
              >
                {isCurrentlyLocating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>Getting your location...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
