"use client";

import React from "react";

export default function Settings() {
  return (
    <div className="bg-white border border-[#D7DEE7] rounded p-5 space-y-5 text-slate-800 font-sans shadow-2xs max-w-4xl">
      <div className="border-b border-[#D7DEE7] pb-3">
        <h2 className="text-base font-bold text-[#1F3A5F]">EOC Command System Settings</h2>
        <p className="text-xs text-slate-500">Operational Display Preferences, Alert Thresholds & User Profile</p>
      </div>

      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-2">
          <h3 className="font-bold text-[#1F3A5F]">Duty Officer Profile</h3>
          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div>Officer Name: <strong>Resident Deputy Collector (RDC)</strong></div>
            <div>Department: <strong>District Disaster Management Authority</strong></div>
            <div>Assigned EOC: <strong>Panvel Sub-Division (Raigad)</strong></div>
            <div>Access Level: <strong>Level 4 (Command & Dispatch)</strong></div>
          </div>
        </div>

        <div className="p-3 bg-[#FAFCFE] border border-[#D7DEE7] rounded space-y-2">
          <h3 className="font-bold text-[#1F3A5F]">Alert & REST Polling Configuration</h3>
          <div className="flex items-center justify-between text-slate-700">
            <span>REST API Auto-Polling Interval:</span>
            <select className="bg-white border border-[#D7DEE7] px-2 py-1 rounded text-xs">
              <option value="7">7 Seconds (Recommended)</option>
              <option value="5">5 Seconds (High Priority)</option>
              <option value="15">15 Seconds</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white font-semibold px-4 py-2 rounded">
            Save System Settings
          </button>
        </div>
      </div>
    </div>
  );
}