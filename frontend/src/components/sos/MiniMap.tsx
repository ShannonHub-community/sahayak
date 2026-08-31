import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { Crosshair, AlertCircle, CheckCircle2, RefreshCw, MapPin, WifiOff, Navigation } from 'lucide-react';
import type { SOSLocation } from '@/types/sos';

export interface MiniMapProps {
  mode?: 'live' | 'pick';
  location: SOSLocation | null;
  onLocationChange?: (loc: SOSLocation) => void;
  onRefreshLocation?: () => void;
  isLoadingLocation?: boolean;
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

// National Center of India (Nagpur / Central fallback)
const DEFAULT_FALLBACK_COORDS = { lat: 20.5937, lng: 78.9629 };

export const MiniMap: React.FC<MiniMapProps> = ({
  mode = 'live',
  location,
  onLocationChange,
  onRefreshLocation,
  isLoadingLocation = false,
  className = '',
  label,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocatingSelf, setIsLocatingSelf] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

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

  // Initialize MapLibre instance once when online
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return; // Don't try loading tile server when completely offline
      }

      try {
        const maplibregl = await import('maplibre-gl');

        const initialLat = location?.lat ?? DEFAULT_FALLBACK_COORDS.lat;
        const initialLng = location?.lng ?? DEFAULT_FALLBACK_COORDS.lng;
        const initialZoom = location && !location.isFallback ? 14 : 5;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: [initialLng, initialLat],
          zoom: initialZoom,
          attributionControl: false,
        });

        // Built-in MapLibre NavigationControl with native compass on top-right overlay
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }),
          'top-right'
        );

        // Built-in MapLibre FullscreenControl for expandable map view
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Ensure map resizes smoothly when toggled to/from fullscreen
        map.on('resize', () => {
          map.resize();
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapLoaded(true);
          setMapError(null);

          // Create marker element
          const el = document.createElement('div');
          el.className = mode === 'live' ? 'live-gps-marker' : 'pin-selection-marker';
          
          const marker = new maplibregl.Marker({
            element: el,
            draggable: mode === 'pick',
          })
            .setLngLat([initialLng, initialLat])
            .addTo(map);

          if (mode === 'pick') {
            marker.on('dragend', () => {
              const lngLat = marker.getLngLat();
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
        });


        // Click handler for mode="pick" (tap-to-pin)
        map.on('click', (e) => {
          if (mode === 'pick' && onLocationChange) {
            const { lng, lat } = e.lngLat;
            if (markerRef.current) {
              markerRef.current.setLngLat([lng, lat]);
            }
            onLocationChange({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
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
    if (!mapRef.current || !location) return;

    const { lat, lng } = location;
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }

    if (mapLoaded && mapRef.current) {
      const targetZoom = location.isFallback ? 5 : 15;
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: targetZoom,
        essential: true,
        duration: 800,
      });
    }
  }, [location?.lat, location?.lng, location?.isFallback, mapLoaded]);

  // Update marker properties when mode changes
  useEffect(() => {
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        el.className = mode === 'live' ? 'live-gps-marker' : 'pin-selection-marker';
      }
      markerRef.current.setDraggable(mode === 'pick');
    }
  }, [mode]);

  // Helper to trigger GPS acquisition in pick mode
  const handlePinCurrentLocation = () => {
    if (typeof window === 'undefined') return;
    if (onRefreshLocation) {
      onRefreshLocation();
      return;
    }
    if (!('geolocation' in navigator)) return;

    setIsLocatingSelf(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingSelf(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        if (onLocationChange) {
          onLocationChange({
            lat,
            lng,
            accuracy: pos.coords.accuracy,
            isFallback: false,
          });
        }
      },
      (err) => {
        console.warn('Geolocation pick error:', err);
        setIsLocatingSelf(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

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
            {location ? (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 tracking-wider">
                  {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
                </div>
                <div className="text-xs text-slate-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Captured with ±{location.accuracy ? Math.round(location.accuracy) : 5}m device precision
                  </span>
                  {location.isFallback && (
                    <span className="text-amber-400 font-bold">(National Fallback)</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm font-mono text-slate-400">
                Acquiring hardware GPS coordinates...
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/80 pt-2">
            <span className="text-[11px] text-slate-400">
              Coordinates will be encoded into automated emergency SMS dispatch.
            </span>

            <button
              type="button"
              onClick={mode === 'live' ? onRefreshLocation : handlePinCurrentLocation}
              disabled={isLoadingLocation || isLocatingSelf}
              className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-blue-400/30 shadow flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {isLoadingLocation || isLocatingSelf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Polling GPS...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                  <span>Re-acquire GPS</span>
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
              {location?.isFallback ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold text-amber-800">National Default (Nagpur)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    {location ? `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E` : 'Tap map to pin'}
                  </span>
                  {location?.accuracy && (
                    <span className="text-[10px] text-gray-500 font-sans">
                      (±{Math.round(location.accuracy)}m)
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {mode === 'live' && onRefreshLocation && (
              <button
                type="button"
                onClick={onRefreshLocation}
                disabled={isLoadingLocation}
                className="pointer-events-auto bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-blue-900 shadow flex items-center gap-1.5 transition-colors disabled:opacity-60"
                title="Re-acquire current GPS position"
              >
                {isLoadingLocation ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Acquiring GPS...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>
            )}

            {/* Refinement 3: Prominent "Use Current Location" in mode="pick" matching live mode */}
            {mode === 'pick' && (
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={handlePinCurrentLocation}
                  disabled={isLocatingSelf || isLoadingLocation}
                  className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-blue-900 shadow flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  title="Auto-fill pin from device GPS location"
                >
                  {isLocatingSelf || isLoadingLocation ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Acquiring GPS...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                      <span>Use Current Location</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};



