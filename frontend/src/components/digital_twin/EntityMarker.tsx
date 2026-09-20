"use client";

import {
  AlertTriangle,
  Siren,
  Plus,
  Truck,
  Sailboat,
  Building2,
  HelpCircle,
  Droplets,
} from "lucide-react";
import { TwinMapState } from "./types";

interface EntityMarkerProps {
  entity: TwinMapState;
  isSelected?: boolean;
}

/**
 * Renders an incident-command-grade map marker for a given entity.
 * Pure visual component — positioning and click interaction are owned by <Marker>.
 */
export function EntityMarker({ entity, isSelected }: EntityMarkerProps) {
  const { entity_type, severity_count, symbol, status } = entity;
  const sym = (symbol ?? "").toLowerCase();

  // ── FLOOD HAZARD ZONE ─────────────────────────────────────────────────────
  if (entity_type === "flood_zone" || sym.includes("flood")) {
    // Extract water depth from status or severity_count
    let depthStr = "1.5m";
    if (entity.depth) {
      depthStr = entity.depth;
    } else if (entity.status && /\d+(\.\d+)?\s*m/i.test(entity.status)) {
      const match = entity.status.match(/\d+(\.\d+)?\s*m/i);
      if (match) depthStr = match[0];
    } else if (typeof severity_count === "number" && !isNaN(severity_count)) {
      if (severity_count > 10) {
        depthStr = `${(severity_count / 10).toFixed(1)}m`;
      } else if (severity_count > 0) {
        depthStr = `${severity_count.toFixed(1)}m`;
      }
    }

    const st = (status ?? "").toLowerCase();
    const isCritical =
      st.includes("critical") ||
      st.includes("overflow") ||
      (typeof severity_count === "number" && severity_count >= 30);

    const displayName = entity.name || (symbol ? symbol.replace(/_/g, " ") : "Flood Hazard Point");

    return (
      <div
        className="relative group cursor-pointer flex flex-col items-center select-none"
        title={`${displayName} — ${depthStr} (${status || "Flood Warning"})`}
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
          <span
            className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${
              isSelected ? "text-white" : "text-slate-900"
            }`}
          >
            {depthStr}
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${
              isSelected ? "text-slate-300" : "text-slate-500"
            }`}
          >
            WATER
          </span>
        </div>

        {/* Subtitle location badge on hover */}
        <div className="absolute top-full mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded shadow-md border border-slate-800 whitespace-nowrap z-10">
          {displayName}
        </div>
      </div>
    );
  }

  // ── SOS REPORT ────────────────────────────────────────────────────────────
  if (entity_type === "sos_report" || entity_type === "sos" || sym.includes("sos")) {
    const sev = severity_count ?? 1;
    // Scale smoothly from 28px up to 58px based on severity (e.g., 2 to 45+)
    let size = 28;
    if (sev > 30) size = 58;
    else if (sev > 15) size = 48;
    else if (sev > 5) size = 38;
    else if (sev > 2) size = 32;

    const iconSize = Math.round(size * 0.45);

    return (
      <div
        className="relative flex items-center justify-center cursor-pointer select-none"
        style={{ width: size, height: size }}
        title={`SOS Report — Severity ${sev} (${status})`}
      >
        {/* Pulsating ring behind the dot */}
        <span
          className="absolute inline-flex rounded-full bg-rose-500 opacity-60 animate-ping"
          style={{ width: size, height: size }}
        />
        {/* Core dot */}
        <span
          className="relative flex items-center justify-center rounded-full bg-rose-600 border-2 border-white shadow-md transition-transform hover:scale-110"
          style={{ width: size, height: size }}
        >
          <Siren
            size={iconSize}
            strokeWidth={2.5}
            className="text-white"
          />
        </span>
      </div>
    );
  }

  // ── RESOURCE UNIT ─────────────────────────────────────────────────────────
  if (entity_type === "resource_unit") {

    // Medical units (ambulance, hospital, medic, aid, clinic, medical)
    if (
      sym.includes("medical") ||
      sym.includes("ambulance") ||
      sym.includes("medic") ||
      sym.includes("hospital") ||
      sym.includes("clinic") ||
      sym.includes("aid")
    ) {
      return (
        <div
          className="w-9 h-9 rounded-md bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          title={`Medical Unit — ${symbol} — ${status}`}
        >
          <Plus size={18} strokeWidth={3} className="text-white" />
        </div>
      );
    }

    // Shelters / Relief Camps
    if (sym.includes("shelter") || sym.includes("camp") || sym.includes("refuge")) {
      return (
        <div
          className="w-9 h-9 rounded-lg bg-blue-900 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          title={`Shelter / Relief Camp (Capacity: ${severity_count || 'N/A'}) — ${status}`}
        >
          <Building2 size={18} strokeWidth={2.2} className="text-white" />
        </div>
      );
    }

    // Fire trucks, rescue trucks, vehicles
    if (sym.includes("truck") || sym.includes("fire") || sym.includes("vehicle")) {
      return (
        <div
          className="w-9 h-9 rounded-md bg-blue-700 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          title={`Rescue Vehicle — ${symbol} — ${status}`}
        >
          <Truck size={17} strokeWidth={2.5} className="text-white" />
        </div>
      );
    }

    // Boats / watercraft rescue
    if (sym.includes("boat") || sym.includes("rescue") || sym.includes("marine")) {
      return (
        <div
          className="w-9 h-9 rounded-md bg-sky-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          title={`Rescue Vessel — ${symbol} — ${status}`}
        >
          <Sailboat size={17} strokeWidth={2.5} className="text-white" />
        </div>
      );
    }

    // Generic resource
    return (
      <div
        className="w-8 h-8 rounded-full bg-slate-700 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 text-white text-[10px] font-bold uppercase tracking-wide"
        title={`Resource Unit — ${symbol} — ${status}`}
      >
        {sym.slice(0, 2) || "R"}
      </div>
    );
  }

  // ── INFRASTRUCTURE DAMAGE (PDNA) ─────────────────────────────────────────
  if (entity_type === "infra_damage" || entity_type === "infrastructure") {
    // Resolve severity from entity attributes
    const rawSev = (
      entity.severity ||
      entity.metadata?.severity ||
      (status ?? "")
    ).toLowerCase();

    const isCritical =
      rawSev.includes("critical") ||
      sym.includes("critical") ||
      (typeof severity_count === "number" && severity_count >= 3);

    const isLow =
      rawSev.includes("low") ||
      sym.includes("low") ||
      (typeof severity_count === "number" && severity_count === 1);

    // Color code: Yellow for Low, Orange for Medium, Black for Critical
    let badgeColor = "bg-orange-500 text-white border-white";
    let iconColor = "text-white";
    let severityLabel = "Medium";

    if (isCritical) {
      badgeColor = "bg-black text-amber-400 border-amber-400 shadow-md ring-2 ring-rose-600 animate-pulse";
      iconColor = "text-amber-400";
      severityLabel = "Critical";
    } else if (isLow) {
      badgeColor = "bg-yellow-400 text-yellow-950 border-white shadow-sm";
      iconColor = "text-yellow-950";
      severityLabel = "Low";
    }

    const displayName = entity.name || entity.metadata?.category || (symbol ? symbol.replace(/_/g, " ") : "Damage Hazard");

    return (
      <div
        className={`w-9 h-9 rounded-md border-2 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${badgeColor} ${
          isSelected ? "ring-2 ring-blue-500 scale-115 shadow-xl" : ""
        }`}
        title={`Infrastructure Damage [${severityLabel}] — ${displayName} (${status || "Pending"})`}
      >
        <AlertTriangle size={19} strokeWidth={2.6} className={iconColor} />
      </div>
    );
  }

  // ── BUILDING / STRUCTURE ──────────────────────────────────────────────────
  if (entity_type === "building" || sym.includes("building") || sym.includes("shelter")) {
    return (
      <div
        className="w-8 h-8 rounded bg-slate-700 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
        title={`Structure — ${symbol} — ${status}`}
      >
        <Building2 size={16} strokeWidth={2} className="text-white" />
      </div>
    );
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  return (
    <div
      className="w-7 h-7 rounded-full bg-slate-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
      title={`${entity_type} — ${symbol} — ${status}`}
    >
      <HelpCircle size={14} strokeWidth={2} className="text-white" />
    </div>
  );
}

export default EntityMarker;
