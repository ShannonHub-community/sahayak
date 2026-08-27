import React from 'react';
import { useLedger } from '../context/LedgerContext';
import { X, Users, CheckCircle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export const WorkforceDemandModal = () => {
  const { selectedWorkforceDemandModal, setSelectedWorkforceDemandModal, deployWorkforce } = useLedger();

  if (!selectedWorkforceDemandModal) return null;

  const item = selectedWorkforceDemandModal;
  const isDeployed = item.status === 'Deployed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">Workforce Demand Details</h2>
          </div>
          <button
            onClick={() => setSelectedWorkforceDemandModal(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Station</span>
              <span className="font-extrabold text-sm text-slate-900">{item.targetLocation}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sector</span>
              <span className="font-bold text-slate-700">{item.sector}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2">Required Resources & Deployment Status</h4>
            <div className="space-y-2">
              {item.demands.map((req, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{req.count} {req.resource}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    req.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : req.status === 'Deployed'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-indigo-900 text-[11px]">
            <p className="font-medium">
              Connecting available inventory directly with real-time workforce requests from the Workforce Tab.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setSelectedWorkforceDemandModal(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>

          {!isDeployed ? (
            <button
              onClick={() => deployWorkforce(item.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center space-x-1 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Deploy Resources</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-blue-600" /> Dispatched
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
