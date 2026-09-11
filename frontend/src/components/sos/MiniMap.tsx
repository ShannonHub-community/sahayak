import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, AlertCircle, CheckCircle2, RefreshCw, MapPin, WifiOff, X } from 'lucide-react';
import type { SOSLocation } from '@/types/sos';
import { getRealCoordinates } from '@/services/geolocation';

export interface ShelterLocationInfo {
  lat: number;
  lng: number;
  name?: string;
  distance?: string;
  cardinal?: string;
  bearing?: number;
  category?: string;
}

export interface MiniMapProps {
  mode?: 'live' | 'pick' | 'route';
  location: SOSLocation | null;
  shelterLocation?: ShelterLocationInfo | null;
  readOnly?: boolean;
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
 * Route mode / dual marker: tagged citizen beacon with "YOU (SOS)".
 * Live mode: pulsating blue GPS beacon ring and center dot.
 * Pick mode: bright red map pin with drop shadow.
 */
function renderCitizenMarkerContent(el: HTMLElement, mode: 'live' | 'pick' | 'route', hasShelter: boolean) {
  if (mode === 'route' || hasShelter) {
    el.className = 'citizen-location-marker';
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
        <div style="background-color: #0B3D6E; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-bottom: 2px; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          YOU (SOS)
        </div>
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background-color: rgba(11, 61, 110, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background-color: #0B3D6E; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45);"></div>
        </div>
      </div>
    `;
  } else if (mode === 'live') {
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

/**
 * Creates high-contrast, visually distinct emerald marker DOM elements for the nearest shelter.
 */
function renderShelterMarkerContent(el: HTMLElement, name?: string) {
  el.className = 'shelter-destination-marker';
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
      <div style="background-color: #166534; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-bottom: 2px; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
        ${name || 'SHELTER'}
      </div>
      <div style="width: 32px; height: 32px; border-radius: 50%; background: #16A34A; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 15px;">
        ★
      </div>
    </div>
  `;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  mode = 'live',
  location,
  shelterLocation,
  readOnly = false,
  onLocationChange,
  onRefreshLocation,
  isLoadingLocation = false,
  locationError = null,
  className = '',
  label,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const citizenMarkerRef = useRef<MapLibreMarker | null>(null);
  const shelterMarkerRef = useRef<MapLibreMarker | null>(null);
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
  const isReadOnly = readOnly || mode === 'route';

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

  // Helper: sync or create citizen marker
  const syncCitizenMarker = (mapInstance: MapLibreMap, targetLng: number, targetLat: number) => {
    if (citizenMarkerRef.current) {
      citizenMarkerRef.current.setLngLat([targetLng, targetLat]);
      return;
    }

    const MarkerConstructor = maplibreglRef.current?.Marker || (window as any).maplibregl?.Marker;
    const PopupConstructor = maplibreglRef.current?.Popup || (window as any).maplibregl?.Popup;
    if (!MarkerConstructor) return;

    const el = document.createElement('div');
    renderCitizenMarkerContent(el, mode, Boolean(shelterLocation));

    const marker = new MarkerConstructor({
      element: el,
      draggable: mode === 'pick' && !isReadOnly,
    })
      .setLngLat([targetLng, targetLat])
      .addTo(mapInstance);

    if (PopupConstructor) {
      const popup = new PopupConstructor({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-weight: bold; font-size: 12px; color: #0B3D6E;">Your Reported Location</div>
          <div style="font-size: 11px; color: #4B5563; font-family: monospace; margin-top: 2px;">
            ${targetLat.toFixed(5)}°N, ${targetLng.toFixed(5)}°E
          </div>
          <div style="font-size: 10px; color: #16A34A; font-weight: 600; margin-top: 2px;">
            Emergency SOS Transmitted
          </div>
        </div>
      `);
      marker.setPopup(popup);
    }

    if (mode === 'pick' && !isReadOnly) {
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

    citizenMarkerRef.current = marker;
  };

  // Helper: sync or create shelter marker
  const syncShelterMarker = (mapInstance: MapLibreMap, sLoc: ShelterLocationInfo) => {
    if (shelterMarkerRef.current) {
      shelterMarkerRef.current.setLngLat([sLoc.lng, sLoc.lat]);
      return;
    }

    const MarkerConstructor = maplibreglRef.current?.Marker || (window as any).maplibregl?.Marker;
    const PopupConstructor = maplibreglRef.current?.Popup || (window as any).maplibregl?.Popup;
    if (!MarkerConstructor) return;

    const el = document.createElement('div');
    renderShelterMarkerContent(el, sLoc.name);

    const marker = new MarkerConstructor({
      element: el,
      draggable: false,
    })
      .setLngLat([sLoc.lng, sLoc.lat])
      .addTo(mapInstance);

    if (PopupConstructor) {
      const popup = new PopupConstructor({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-weight: bold; font-size: 12px; color: #166534;">
            ${sLoc.name || 'Assigned Relief Shelter'}
          </div>
          <div style="font-size: 11px; color: #374151; margin-top: 2px;">
            ${sLoc.distance ? `Distance: <strong>${sLoc.distance}</strong>` : ''}
            ${sLoc.cardinal ? ` (${sLoc.cardinal})` : ''}
          </div>
          <div style="font-size: 10px; color: #6B7280; font-family: monospace; margin-top: 2px;">
            ${sLoc.lat.toFixed(5)}°N, ${sLoc.lng.toFixed(5)}°E
          </div>
        </div>
      `);
      marker.setPopup(popup);
    }

    shelterMarkerRef.current = marker;
  };

  // Helper: draw/update dashed route line between citizen and shelter
  const updateRouteLine = (
    mapInstance: MapLibreMap,
    start: [number, number],
    end: [number, number]
  ) => {
    try {
      if (!mapInstance.isStyleLoaded()) return;

      const routeGeoJSON: any = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [start, end],
        },
      };

      const source: any = mapInstance.getSource('shelter-route-line');
      if (source) {
        source.setData(routeGeoJSON);
      } else {
        mapInstance.addSource('shelter-route-line', {
          type: 'geojson',
          data: routeGeoJSON,
        });
        mapInstance.addLayer({
          id: 'shelter-route-line-layer',
          type: 'line',
          source: 'shelter-route-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#16A34A',
            'line-width': 3,
            'line-dasharray': [2, 2],
          },
        });
      }
    } catch (err) {
      console.warn('Could not update route line on map:', err);
    }
  };

  // Helper: apply coordinates, sync dual markers, and fit bounds
  const updateMapBoundsAndMarkers = (mapInstance: MapLibreMap, shouldFly: boolean = false) => {
    const currentLoc = latestLocationRef.current;
    const hasRealCitizenLoc = currentLoc && !currentLoc.isFallback;
    const hasShelter = Boolean(shelterLocation);

    // 1. Sync citizen marker
    if (hasRealCitizenLoc) {
      syncCitizenMarker(mapInstance, currentLoc.lng, currentLoc.lat);
    } else if (citizenMarkerRef.current) {
      citizenMarkerRef.current.remove();
      citizenMarkerRef.current = null;
    }

    // 2. Sync shelter marker
    if (shelterLocation) {
      syncShelterMarker(mapInstance, shelterLocation);
    } else if (shelterMarkerRef.current) {
      shelterMarkerRef.current.remove();
      shelterMarkerRef.current = null;
    }

    // 3. Fit bounds when BOTH markers are present
    if (hasRealCitizenLoc && hasShelter && shelterLocation) {
      const LngLatBounds = maplibreglRef.current?.LngLatBounds || (window as any).maplibregl?.LngLatBounds;
      if (LngLatBounds) {
        const bounds = new LngLatBounds();
        bounds.extend([currentLoc.lng, currentLoc.lat]);
        bounds.extend([shelterLocation.lng, shelterLocation.lat]);

        mapInstance.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 16,
          duration: shouldFly && mapLoaded ? 800 : 0,
        });
      }

      // Draw dashed connecting route line
      updateRouteLine(mapInstance, [currentLoc.lng, currentLoc.lat], [shelterLocation.lng, shelterLocation.lat]);
    } else if (hasRealCitizenLoc) {
      // Single citizen location view
      if (shouldFly && mapLoaded) {
        mapInstance.flyTo({
          center: [currentLoc.lng, currentLoc.lat],
          zoom: 15,
          essential: true,
          duration: 800,
        });
      } else {
        mapInstance.setCenter([currentLoc.lng, currentLoc.lat]);
        mapInstance.setZoom(15);
      }
    } else if (hasShelter && shelterLocation) {
      // Single shelter view
      mapInstance.setCenter([shelterLocation.lng, shelterLocation.lat]);
      mapInstance.setZoom(14);
    }

    mapInstance.resize();
  };

  // Unified GPS acquisition trigger used by both mode="live" and mode="pick"
  const handleAcquireCurrentLocation = async () => {
    if (isReadOnly || typeof window === 'undefined') return;

    if (mode === 'live' && onRefreshLocation) {
      onRefreshLocation();
      return;
    }

    setIsLocatingSelf(true);
    setInternalLocationError(null);

    try {
      const coords = await getRealCoordinates();
      setIsLocatingSelf(false);
      setInternalLocationError(null);

      if (mapRef.current) {
        syncCitizenMarker(mapRef.current, coords.lng, coords.lat);
        updateMapBoundsAndMarkers(mapRef.current, true);
      }

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
        const initialLat = hasRealLocation
          ? activeLoc.lat
          : shelterLocation
          ? shelterLocation.lat
          : INITIAL_OVERVIEW_CENTER.lat;
        const initialLng = hasRealLocation
          ? activeLoc.lng
          : shelterLocation
          ? shelterLocation.lng
          : INITIAL_OVERVIEW_CENTER.lng;
        const initialZoom = hasRealLocation ? 15 : shelterLocation ? 14 : 4.5;

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

          // Update markers and bounds when map canvas is ready
          updateMapBoundsAndMarkers(map, false);
        });

        // Click handler for mode="pick" (manual tap-to-pin, disabled if read-only)
        map.on('click', (e) => {
          if (mode === 'pick' && !isReadOnly && onLocationChange) {
            const { lng, lat } = e.lngLat;
            setInternalLocationError(null);
            const newLat = Number(lat.toFixed(6));
            const newLng = Number(lng.toFixed(6));

            syncCitizenMarker(map, newLng, newLat);

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
          setMapError('Map display unavailable offline. Coordinates captured.');
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
      if (citizenMarkerRef.current) {
        citizenMarkerRef.current.remove();
        citizenMarkerRef.current = null;
      }
      if (shelterMarkerRef.current) {
        shelterMarkerRef.current.remove();
        shelterMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOnline]);

  // Update markers and bounds when location or shelterLocation props change
  useEffect(() => {
    latestLocationRef.current = location;
    if (!mapRef.current) return;
    updateMapBoundsAndMarkers(mapRef.current, mapLoaded);
  }, [location?.lat, location?.lng, location?.isFallback, shelterLocation?.lat, shelterLocation?.lng, mapLoaded, mode, isReadOnly]);

  // Update citizen marker draggability when mode or readOnly changes
  useEffect(() => {
    if (citizenMarkerRef.current) {
      const el = citizenMarkerRef.current.getElement();
      if (el) {
        renderCitizenMarkerContent(el, mode, Boolean(shelterLocation));
      }
      citizenMarkerRef.current.setDraggable(mode === 'pick' && !isReadOnly);
    }
  }, [mode, isReadOnly, Boolean(shelterLocation)]);

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
              <span>OFFLINE MODE ACTIVE</span>
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

      {/* 1. OFFLINE VIEW: Raw coordinates display for citizen AND shelter when map cannot render */}
      {isMapOffline ? (
        <div className="w-full min-h-[220px] bg-slate-900 text-white p-4 sm:p-5 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                {shelterLocation ? 'Offline Map — Coordinates & Shelter Route:' : 'Map unavailable offline — your location:'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {shelterLocation ? 'OFFLINE EVACUATION DATA' : 'GPS SATELLITE LOCK'}
            </span>
          </div>

          <div className="my-auto py-3">
            {shelterLocation ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {/* Citizen Coordinates Card */}
                <div className="bg-slate-800/90 border border-slate-700 rounded p-3">
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Your Reported Location</span>
                  </div>
                  {location && !location.isFallback ? (
                    <>
                      <div className="text-base sm:text-lg font-mono font-bold text-white">
                        {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>±{location.accuracy ? Math.round(location.accuracy) : 5}m accuracy</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-mono text-amber-300">
                      Coordinates captured in distress dispatch
                    </div>
                  )}
                </div>

                {/* Shelter Coordinates Card */}
                <div className="bg-slate-800/90 border border-emerald-700/60 rounded p-3">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <span className="text-emerald-400 font-bold">★</span>
                    <span className="truncate">{shelterLocation.name || 'Assigned Relief Shelter'}</span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-emerald-300">
                    {shelterLocation.lat.toFixed(4)}° N, {shelterLocation.lng.toFixed(4)}° E
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 font-medium">
                    Distance: <strong className="text-white">{shelterLocation.distance || 'Nearest'}</strong>
                    {shelterLocation.cardinal && (
                      <span className="ml-1 text-emerald-400 font-bold">({shelterLocation.cardinal})</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Single Location Offline View */
              <div className="text-center">
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
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/80 pt-2">
            <span className="text-[11px] text-slate-400">
              {shelterLocation
                ? `Offline emergency protocol active. Proceed along ${shelterLocation.cardinal || 'designated'} bearing.`
                : 'Coordinates will be encoded into automated emergency SMS dispatch.'}
            </span>

            {!isReadOnly && (
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
            )}
          </div>
        </div>
      ) : (
        /* 2. ONLINE VIEW: MapLibre Interactive Map Canvas */
        <>
          <div className="relative w-full h-48 sm:h-56 min-h-[200px] bg-slate-200">
            <div
              ref={mapContainerRef}
              className={`w-full h-full ${mode === 'pick' && !isReadOnly ? 'cursor-crosshair' : ''}`}
              tabIndex={0}
              aria-label={label || 'Location Map'}
            />

            {/* Map Loading Skeleton / Spinner */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-slate-200 flex flex-col items-center justify-center gap-2 text-xs text-gray-700 animate-pulse select-none">
                <RefreshCw className="w-5 h-5 text-[#0B3D6E] animate-spin" />
                <span className="font-semibold font-mono">
                  {shelterLocation ? 'Mapping Evacuation Route & Shelters...' : 'Initializing National Grid Map...'}
                </span>
              </div>
            )}
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Coordinates / Route Status Pill */}
            <div className="bg-white/95 backdrop-blur-none border border-gray-300 shadow-sm px-2.5 py-1 rounded text-[11px] font-mono pointer-events-auto flex items-center gap-2 text-gray-800">
              {shelterLocation ? (
                <>
                  <span className="flex items-center gap-1 text-[#0B3D6E] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#0B3D6E]" />
                    <span>You: {location ? `${location.lat.toFixed(3)}°, ${location.lng.toFixed(3)}°` : 'Submitted'}</span>
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="flex items-center gap-1 text-emerald-800 font-bold truncate max-w-[200px] sm:max-w-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{shelterLocation.name || 'Shelter'} ({shelterLocation.distance || '0 km'})</span>
                  </span>
                </>
              ) : isCurrentlyLocating ? (
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
                    {mode === 'pick' && !isReadOnly ? 'Tap map to pin location' : 'Location unavailable'}
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

            {/* Unified Action Button: Hidden when readOnly */}
            {!isReadOnly && (onRefreshLocation || onLocationChange) && (
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
