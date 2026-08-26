"use client";

import React from "react";
import {
  AlertTriangle,
  Siren,
  Plus,
  Truck,
  Sailboat,
  Building2,
  HelpCircle,
} from "lucide-react";
import { TwinMapState } from "./types";

interface EntityMarkerProps {
  entity: TwinMapState;
}

/**
 * Renders an incident-command-grade map marker for a given entity.
 * Pure visual component — positioning and click interaction are owned by <Marker>.
 */
export function EntityMarker({ entity }: EntityMarkerProps) {
  const { entity_type, severity_count, symbol, status } = entity;
  const sym = (symbol ?? "").toLowerCase();

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
          className="absolute inline-flex rounded-full bg-red-500 opacity-75 animate-ping"
          style={{ width: size, height: size }}
        />
        {/* Core dot */}
        <span
          className="relative flex items-center justify-center rounded-full bg-red-600 border-2 border-white shadow-lg transition-transform hover:scale-110"
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
          className="w-9 h-9 rounded-md bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 hover:shadow-emerald-400/60 hover:shadow-xl"
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
          className="w-9 h-9 rounded-lg bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
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
          className="w-9 h-9 rounded-md bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
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
          className="w-9 h-9 rounded-md bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          title={`Rescue Vessel — ${symbol} — ${status}`}
        >
          <Sailboat size={17} strokeWidth={2.5} className="text-white" />
        </div>
      );
    }

    // Generic resource
    return (
      <div
        className="w-8 h-8 rounded-full bg-teal-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 text-white text-[10px] font-bold uppercase tracking-wide"
        title={`Resource Unit — ${symbol} — ${status}`}
      >
        {sym.slice(0, 2) || "R"}
      </div>
    );
  }

  // ── INFRASTRUCTURE DAMAGE ─────────────────────────────────────────────────
  if (entity_type === "infrastructure" || entity_type === "infra_damage") {
    return (
      <div
        className="w-9 h-9 rounded bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
        title={`Infrastructure Damage — ${symbol} — ${status}`}
      >
        <AlertTriangle size={18} strokeWidth={2.5} className="text-white" />
      </div>
    );
  }

  // ── BUILDING / STRUCTURE ──────────────────────────────────────────────────
  if (entity_type === "building" || sym.includes("building") || sym.includes("shelter")) {
    return (
      <div
        className="w-8 h-8 rounded bg-violet-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
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
