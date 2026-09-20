"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
// Removed StyleSpecification import
import "maplibre-gl/dist/maplibre-gl.css";
import {
  X,
  MapPin,
  Clock,
  Activity,
  ShieldAlert,
  AlertCircle,
  Droplets,
  Waves,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { useTwinStore } from "@/store/twinStore";
import { useTwinWebsocket } from "./hooks/useTwinWebsocket";
import ConnectionBadge from "./ConnectionBadge";
import EntityMarker from "./EntityMarker";
import { TwinMapState } from "./types";

/**
 * Stable MapLibre Raster Style for OpenStreetMap base tiles.
 * v2 — marker-based flood zones, no GeoJSON fill layers.
 */
const OSM_RASTER_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Flood & Inundation Observation Point Definition
 */
export interface FloodPoint {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  depth: string;
  depthNum: number;
  status: "Critical Overflow" | "Severe Inundation" | "Moderate Inundation" | "Rising Stream";
  severity: "critical" | "warning" | "caution";
  river: string;
  flowSpeed: string;
  notes: string;
  last_updated: string;
}

export default function DigitalTwinMap() {
  useTwinWebsocket();

  const entities = useTwinStore((state) => state.entities);
  // selectedEntity is lifted into the Zustand store so CommandCenter
  // can read it reactively without prop drilling.
  const selectedEntity = useTwinStore((state) => state.selectedEntity);
  const setSelectedEntity = useTwinStore((state) => state.setSelectedEntity);

  // Deep-link auto focus on incident from URL params (?focus=...&lat=...&lng=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const focusId = params.get("focus");
      const latStr = params.get("lat");
      const lngStr = params.get("lng");
      if (focusId && (latStr || lngStr)) {
        const lat = parseFloat(latStr || "0");
        const lng = parseFloat(lngStr || "0");
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          const existing = entities[focusId];
          if (existing) {
            setSelectedEntity(existing);
          } else {
            const focusedEntity: TwinMapState = {
              id: focusId,
              entity_type: "infra_damage",
              symbol: "infra_damage",
              name: `PDNA Report ${focusId}`,
              severity_count: 3,
              severity: "Critical",
              status: "Assigned to Repair Crew",
              location: { lat, lng },
              last_updated: new Date().toISOString(),
              metadata: {
                photo_url: "/placeholder.jpg",
                category: "Infrastructure Damage Assessment",
                severity: "Critical",
              },
            };
            setSelectedEntity(focusedEntity);
            useTwinStore.setState((state) => ({
              entities: {
                ...state.entities,
                [focusId]: focusedEntity,
              },
            }));
          }
        }
      }
    }
  }, [entities, setSelectedEntity]);

  const getCoordinates = (entity: TwinMapState): { lat: number; lng: number } | null => {
    if (!entity || !entity.location) return null;
    let lat = 0;
    let lng = 0;

    if (typeof entity.location === "object") {
      lat = Number(entity.location.lat ?? entity.location.latitude ?? 0);
      lng = Number(entity.location.lng ?? entity.location.longitude ?? 0);
    } else if (typeof entity.location === "string" && entity.location.includes("POINT")) {
      const parts = entity.location.replace(/POINT|\(|\)/gi, "").trim().split(/\s+/);
      if (parts.length >= 2) {
        lng = Number(parts[0]);
        lat = Number(parts[1]);
      }
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "critical" || s === "busy") return "bg-rose-50 text-rose-700 border-rose-200";
    if (s === "available" || s === "open" || s === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "deployed") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "sos_report":
      case "sos": return "SOS Incident";
      case "resource_unit": return "Response Resource";
      case "infrastructure":
      case "infra_damage": return "Infrastructure Alert";
      case "flood_zone": return "Flood Hazard Zone";
      default: return type.toUpperCase();
    }
  };

  const selectedEntityCoords = selectedEntity ? getCoordinates(selectedEntity) : null;

  return (
    <div className="w-full h-full min-h-[500px] relative select-none">
      <Map
        initialViewState={{
          longitude: 73.1166,
          latitude: 18.9894,
          zoom: 13,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={OSM_RASTER_STYLE}
        onClick={() => {
          setSelectedEntity(null);
        }}
      >
        {/* ── Live Entity Markers from twinStore (SOS, Medical, Rescue, Shelters, Flood Zones) ─── */}
        {Object.values(entities).map((entity: TwinMapState) => {
          const coords = getCoordinates(entity);
          if (!coords) return null;
          const isSelected = selectedEntity?.id === entity.id;

          return (
            <Marker
              key={entity.id}
              longitude={coords.lng}
              latitude={coords.lat}
              anchor="center"
              onClick={(e: any) => {
                e.originalEvent.stopPropagation();
                setSelectedEntity(selectedEntity?.id === entity.id ? null : entity);
              }}
            >
              <div className="cursor-pointer">
                <EntityMarker entity={entity} isSelected={isSelected} />
              </div>
            </Marker>
          );
        })}

        {/* ── Details Popup for Selected Entity (Incident, Resource, or Flood Zone) ─── */}
        {selectedEntity && selectedEntityCoords && (
          <Popup
            longitude={selectedEntityCoords.lng}
            latitude={selectedEntityCoords.lat}
            anchor="bottom"
            offset={18}
            onClose={() => setSelectedEntity(null)}
            closeButton={false}
            closeOnClick={false}
            className="z-50"
          >
            {selectedEntity.entity_type === "infra_damage" || selectedEntity.entity_type === "infrastructure" ? (
              /* ── PDNA Infrastructure Damage Details Popup ────────────────── */
              <div className="bg-white text-slate-900 border border-slate-200 rounded-lg shadow-md p-3 w-64 font-sans pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 rounded bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                      <AlertTriangle size={14} className="text-amber-600" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        PDNA Damage Assessment
                      </h4>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {selectedEntity.metadata?.category || selectedEntity.name || selectedEntity.symbol.replace(/_/g, " ") || "Hazard Report"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntity(null);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Photo Thumbnail Placeholder */}
                <div className="relative w-full h-24 bg-slate-100 rounded border border-slate-200 overflow-hidden mb-2 flex items-center justify-center">
                  <img
                    src={selectedEntity.metadata?.photo_url || "/placeholder.jpg"}
                    alt="Damage assessment thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector(".photo-fallback")) {
                        const fb = document.createElement("div");
                        fb.className = "photo-fallback flex flex-col items-center justify-center text-slate-400 p-2 text-center";
                        fb.innerHTML = '<span class="text-xs font-bold text-slate-600">Damage Site Photo</span><span class="text-[9px] text-slate-400 mt-0.5">Field assessment capture</span>';
                        parent.appendChild(fb);
                      }
                    }}
                  />
                </div>

                {/* Damage Category & Severity */}
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 text-[10px]">Severity:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        (selectedEntity.metadata?.severity || selectedEntity.severity || "").toLowerCase() === "critical" ||
                        (typeof selectedEntity.severity_count === "number" && selectedEntity.severity_count >= 3)
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : (selectedEntity.metadata?.severity || selectedEntity.severity || "").toLowerCase() === "low" ||
                            selectedEntity.severity_count === 1
                          ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {selectedEntity.metadata?.severity || selectedEntity.severity || (selectedEntity.severity_count >= 3 ? "Critical" : selectedEntity.severity_count === 1 ? "Low" : "Medium")}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Status / स्थिति:
                    </label>
                    <select
                      value={selectedEntity.status || "Pending"}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const updated = { ...selectedEntity, status: newStatus };
                        setSelectedEntity(updated);
                        useTwinStore.setState((state) => ({
                          entities: {
                            ...state.entities,
                            [updated.id]: updated,
                          },
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D6E]"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Assigned to Repair Crew">Assigned to Repair Crew</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Coordinates */}
                  {selectedEntityCoords && (
                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 text-[9px] text-slate-500">
                      <div className="flex items-center gap-0.5">
                        <MapPin size={10} className="text-slate-400" />
                        <span>GPS:</span>
                      </div>
                      <span className="font-mono text-slate-700">
                        {selectedEntityCoords.lat.toFixed(4)}, {selectedEntityCoords.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedEntity.entity_type === "flood_zone" || (selectedEntity.symbol && selectedEntity.symbol.toLowerCase().includes("flood")) ? (
              <div className="bg-white text-slate-900 border border-slate-200 rounded-lg shadow-md p-2.5 w-60 font-sans pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 rounded bg-blue-50 border border-blue-200 text-blue-900 shrink-0">
                      <Waves size={14} className="text-blue-900" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        Flood Hazard Zone
                      </h4>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {selectedEntity.name || selectedEntity.symbol.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntity(null);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-1.5 text-[11px]">
                  {/* Status & Severity */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 text-[10px]">Status:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        selectedEntity.status?.toLowerCase().includes("critical") ||
                        (typeof selectedEntity.severity_count === "number" && selectedEntity.severity_count >= 30)
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {selectedEntity.status || "Active Flood Alert"}
                    </span>
                  </div>

                  {/* Depth & Flow Rate */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                      <div className="flex items-center gap-1 text-[9px] text-slate-600 mb-0.5 font-medium">
                        <Droplets size={10} className="text-blue-600" />
                        <span>Water Depth</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {(() => {
                          if (selectedEntity.depth) return selectedEntity.depth;
                          if (selectedEntity.status && /\d+(\.\d+)?\s*m/i.test(selectedEntity.status)) {
                            const match = selectedEntity.status.match(/\d+(\.\d+)?\s*m/i);
                            if (match) return match[0];
                          }
                          const sc = selectedEntity.severity_count;
                          if (typeof sc === "number") {
                            return sc > 10 ? `${(sc / 10).toFixed(1)}m` : `${sc.toFixed(1)}m`;
                          }
                          return "1.5m";
                        })()}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                      <div className="flex items-center gap-1 text-[9px] text-slate-600 mb-0.5 font-medium">
                        <Gauge size={10} className="text-slate-500" />
                        <span>Current Speed</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {selectedEntity.flowSpeed || "1.5 m/s"}
                      </p>
                    </div>
                  </div>

                  {/* River Source / Basin */}
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-500">Channel / Basin:</span>
                    <span className="text-slate-900 font-semibold truncate">
                      {selectedEntity.river || selectedEntity.symbol.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Field Notes */}
                  {selectedEntity.notes && (
                    <div className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 leading-tight">
                      <span className="text-slate-900 font-semibold">Incident Note: </span>
                      {selectedEntity.notes}
                    </div>
                  )}

                  {/* Telemetry Sync Timestamp */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[9px] text-slate-500">
                    <div className="flex items-center gap-0.5">
                      <Clock size={10} className="text-slate-400" />
                      <span>Telemetry Sync:</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {selectedEntity.last_updated
                        ? new Date(selectedEntity.last_updated).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Live"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Incident Command Details Popup (For SOS & Resources) */
              <div className="bg-white text-slate-900 border border-slate-200 rounded-lg shadow-md p-2.5 w-52 font-sans select-none pointer-events-auto">
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 rounded bg-slate-100 border border-slate-200 shrink-0">
                      {selectedEntity.entity_type === "sos_report" || selectedEntity.entity_type === "sos" ? (
                        <ShieldAlert size={13} className="text-rose-600" />
                      ) : selectedEntity.entity_type === "infrastructure" ? (
                        <AlertCircle size={13} className="text-amber-600" />
                      ) : (
                        <Activity size={13} className="text-emerald-600" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                        {getEntityTypeLabel(selectedEntity.entity_type)}
                      </h4>
                      <p className="text-xs font-bold text-slate-900 capitalize truncate">
                        {selectedEntity.symbol.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntity(null);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 text-[10px]">Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize border ${getStatusBadge(selectedEntity.status)}`}>
                      {selectedEntity.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 text-[10px]">
                      {selectedEntity.entity_type === "resource_unit" && selectedEntity.symbol.includes("shelter")
                        ? "Capacity:"
                        : selectedEntity.entity_type === "sos_report" || selectedEntity.entity_type === "sos"
                          ? "Severity:"
                          : "Units:"}
                    </span>
                    <span className="font-semibold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                      {selectedEntity.severity_count ?? 1}
                    </span>
                  </div>

                  {/* Coordinates */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[9px] text-slate-500">
                    <div className="flex items-center gap-0.5">
                      <MapPin size={10} className="text-slate-400" />
                      <span>Coords:</span>
                    </div>
                    <span className="font-mono text-slate-700">
                      {selectedEntityCoords.lat.toFixed(4)}, {selectedEntityCoords.lng.toFixed(4)}
                    </span>
                  </div>

                  {/* Last Updated */}
                  {selectedEntity.last_updated && (
                    <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500">
                      <div className="flex items-center gap-0.5">
                        <Clock size={9} className="text-slate-400" />
                        <span>Updated:</span>
                      </div>
                      <span className="text-slate-700">
                        {new Date(selectedEntity.last_updated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Popup>
        )}
      </Map>

      {/* Live connection status badge */}
      <ConnectionBadge />
    </div>
  );
}
