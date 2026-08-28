"use client";

import { useState } from "react";
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

/**
 * Strategic Flood / Water Level Observation Points in the Panvel region
 */
export const MOCK_FLOOD_POINTS: FloodPoint[] = [
  {
    id: "flood-pt-1",
    name: "Kalundre Riverbank (West Basin)",
    location: { lat: 18.9950, lng: 73.1090 },
    depth: "4.2m",
    depthNum: 4.2,
    status: "Critical Overflow",
    severity: "critical",
    river: "Kalundre River",
    flowSpeed: "2.8 m/s",
    notes: "Riverbank breached. Water encroaching into low-lying residential sectors.",
    last_updated: "2 mins ago",
  },
  {
    id: "flood-pt-2",
    name: "Panvel Market Yard Lowlands",
    location: { lat: 18.9890, lng: 73.1160 },
    depth: "2.6m",
    depthNum: 2.6,
    status: "Severe Inundation",
    severity: "warning",
    river: "Gadhi Drainage Channel",
    flowSpeed: "1.4 m/s",
    notes: "Commercial basement flooding reported. Road access submerged ~2.5 feet.",
    last_updated: "4 mins ago",
  },
  {
    id: "flood-pt-3",
    name: "Gadhi River Confluence",
    location: { lat: 18.9820, lng: 73.1250 },
    depth: "3.5m",
    depthNum: 3.5,
    status: "Critical Overflow",
    severity: "critical",
    river: "Gadhi River",
    flowSpeed: "3.1 m/s",
    notes: "High tide backwater surge. Low bridge impassable for light response vehicles.",
    last_updated: "Just now",
  },
  {
    id: "flood-pt-4",
    name: "Takka Colony Spillway",
    location: { lat: 19.0040, lng: 73.1210 },
    depth: "1.8m",
    depthNum: 1.8,
    status: "Moderate Inundation",
    severity: "caution",
    river: "Secondary Canal",
    flowSpeed: "0.9 m/s",
    notes: "Water accumulation in railway underpass. Pedestrian and vehicular caution advised.",
    last_updated: "6 mins ago",
  },
];

export default function DigitalTwinMap() {
  useTwinWebsocket();

  const entities = useTwinStore((state) => state.entities);
  // selectedEntity is lifted into the Zustand store so CommandCenter
  // can read it reactively without prop drilling.
  const selectedEntity = useTwinStore((state) => state.selectedEntity);
  const setSelectedEntity = useTwinStore((state) => state.setSelectedEntity);
  const [selectedFlood, setSelectedFlood] = useState<FloodPoint | null>(null);

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
          setSelectedFlood(null);
        }}
      >
        {/* ── Dynamic Flood & Inundation HTML Markers ──────────────────────── */}
        {MOCK_FLOOD_POINTS.map((flood) => {
          const isSelected = selectedFlood?.id === flood.id;
          const isCritical = flood.severity === "critical";

          return (
            <Marker
              key={flood.id}
              longitude={flood.location.lng}
              latitude={flood.location.lat}
              anchor="center"
              onClick={(e: any) => {
                e.originalEvent.stopPropagation();
                setSelectedEntity(null);
                setSelectedFlood((prev) => (prev?.id === flood.id ? null : flood));
              }}
            >
              <div
                className="relative group cursor-pointer flex flex-col items-center"
                title={`${flood.name} — ${flood.depth} (${flood.status})`}
              >
                {/* Outer Pulsating Ripple */}
                <span
                  className={`absolute -inset-1 rounded-full opacity-60 animate-ping ${
                    isCritical ? "bg-rose-400" : "bg-sky-400"
                  }`}
                />

                {/* Clean Flood Badge */}
                <div
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? "bg-slate-900 text-white border-2 border-slate-900 shadow-md scale-105"
                      : "bg-white text-slate-900 border border-slate-300 shadow-sm"
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <Droplets
                      size={13}
                      className={
                        isSelected
                          ? "text-sky-300"
                          : isCritical
                          ? "text-rose-600"
                          : "text-sky-600"
                      }
                    />
                  </span>
                  <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${
                    isSelected ? "text-white" : "text-slate-900"
                  }`}>
                    {flood.depth}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    isSelected ? "text-slate-300" : "text-slate-500"
                  }`}>
                    WATER
                  </span>
                </div>

                {/* Subtitle location badge on hover */}
                <div className="absolute top-full mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded shadow-md border border-slate-800 whitespace-nowrap z-10">
                  {flood.name}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* ── Live Entity Markers (SOS, Medical, Rescue, Shelters) ─────────── */}
        {Object.values(entities).map((entity: TwinMapState) => {
          const coords = getCoordinates(entity);
          if (!coords) return null;

          return (
            <Marker
              key={entity.id}
              longitude={coords.lng}
              latitude={coords.lat}
              anchor="center"
              onClick={(e: any) => {
                e.originalEvent.stopPropagation();
                setSelectedFlood(null);
                setSelectedEntity(selectedEntity?.id === entity.id ? null : entity);
              }}
            >
              <div className="cursor-pointer">
                <EntityMarker entity={entity} />
              </div>
            </Marker>
          );
        })}

        {/* ── Flood Zone Details Popup (No Coordinate Row) ────────────────── */}
        {selectedFlood && (
          <Popup
            longitude={selectedFlood.location.lng}
            latitude={selectedFlood.location.lat}
            anchor="bottom"
            offset={20}
            onClose={() => setSelectedFlood(null)}
            closeButton={false}
            closeOnClick={false}
            className="z-50"
          >
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
                      {selectedFlood.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFlood(null);
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
                      selectedFlood.severity === "critical"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {selectedFlood.status}
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
                      {selectedFlood.depth}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                    <div className="flex items-center gap-1 text-[9px] text-slate-600 mb-0.5 font-medium">
                      <Gauge size={10} className="text-slate-500" />
                      <span>Current Speed</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900">
                      {selectedFlood.flowSpeed}
                    </p>
                  </div>
                </div>

                {/* River Source */}
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-slate-500">Channel / Basin:</span>
                  <span className="text-slate-900 font-semibold">{selectedFlood.river}</span>
                </div>

                {/* Field Notes */}
                <div className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 leading-tight">
                  <span className="text-slate-900 font-semibold">Incident Note: </span>
                  {selectedFlood.notes}
                </div>

                {/* Telemetry Sync Timestamp */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[9px] text-slate-500">
                  <div className="flex items-center gap-0.5">
                    <Clock size={10} className="text-slate-400" />
                    <span>Telemetry Sync:</span>
                  </div>
                  <span className="text-slate-700 font-medium">
                    {selectedFlood.last_updated}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* ── Incident Command Details Popup (For SOS & Resources) ─────────── */}
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
          </Popup>
        )}
      </Map>

      {/* Live connection status badge */}
      <ConnectionBadge />
    </div>
  );
}
