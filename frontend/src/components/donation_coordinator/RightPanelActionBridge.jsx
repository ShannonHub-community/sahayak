import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { Users, Radio, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Info, Send, ArrowRight, ExternalLink } from 'lucide-react';

export const RightPanelActionBridge = () => {
  const {
    workforceDemands,
    publicNeeds,
    aiInsights,
    broadcastNeed,
    setSelectedWorkforceDemandModal,
    setIsPublicBroadcastModalOpen,
    selectedSector
  } = useLedger();

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* SECTION A: WORKFORCE BRIDGE (Workforce Demand) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Workforce Demand</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Bridge resource availability with workforce requirements
              </p>
            </div>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200">
            Workforce Sync
          </span>
        </div>

        {/* Demands List */}
        <div className="p-3 space-y-2.5 max-h-[220px] overflow-y-auto">
          {workforceDemands.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs">
                  {item.targetLocation}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {item.sector}
                </span>
              </div>

              {/* Requirement Items */}
              <div className="space-y-1 my-1.5">
                {item.demands.map((req, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-100">
                    <span className="text-slate-700 font-medium">
                      {req.count} {req.resource}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                        req.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Deployed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 mt-1.5">
                <span className={`text-[10px] font-bold ${
                  item.status === 'Deployed' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {item.status}
                </span>
                <button
                  onClick={() => setSelectedWorkforceDemandModal(item)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer"
                >
                  <span>View Demand</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* SECTION B: PUBLIC NEEDS BROADCAST (Public Needs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Public Needs</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Urgent requirements to broadcast to public channels
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPublicBroadcastModalOpen(true)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>+ Broadcast</span>
          </button>
        </div>

        {/* Public Needs Items */}
        <div className="p-3 space-y-2.5 max-h-[220px] overflow-y-auto">
          {publicNeeds.map((need) => (
            <div
              key={need.id}
              className={`border rounded-lg p-2.5 text-xs ${
                need.isBroadcasted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <AlertCircle className={`w-3.5 h-3.5 ${need.urgency === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`} />
                  {need.title}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white border text-slate-600">
                  {need.location}
                </span>
              </div>

              <p className="text-[11px] text-slate-700 font-medium mb-2">
                {need.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-mono">
                  {need.timestamp}
                </span>
                {need.isBroadcasted ? (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Broadcast Active
                  </span>
                ) : (
                  <button
                    onClick={() => broadcastNeed(need.id)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>Broadcast Need</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* SECTION C: AI INSIGHTS */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">AI Insights</h3>
              <p className="text-[10px] text-slate-400">
                Operational stock depletion & capacity warnings
              </p>
            </div>
          </div>
          <span className="bg-blue-900/60 text-blue-300 font-mono text-[10px] px-2 py-0.5 rounded border border-blue-700/50">
            INTELLIGENCE
          </span>
        </div>

        {/* Insights list */}
        <div className="p-3 space-y-2 overflow-y-auto flex-1 max-h-[260px]">
          {aiInsights.map((insight) => {
            const isCritical = insight.severity === 'Critical';
            const isWarning = insight.severity === 'Warning';
            const isReplenished = insight.type === 'replenished' || insight.severity === 'Success';

            return (
              <div
                key={insight.id}
                className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${
                  isReplenished
                    ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
                    : isCritical
                    ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                    : isWarning
                    ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {isReplenished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  ) : isWarning ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] opacity-75 mb-0.5">
                      <span className="font-bold uppercase tracking-wider">{insight.severity}</span>
                      <span>{insight.sector}</span>
                    </div>
                    <p className="font-medium">{insight.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
