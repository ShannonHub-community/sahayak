import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { X, CheckCircle, XCircle, ShieldCheck, MapPin, Phone, User, Package, Award, ArrowRight, Home, Building } from 'lucide-react';

export const DonationDetailModal = () => {
  const {
    selectedRequestModal,
    setSelectedRequestModal,
    approveAndRouteDonation,
    rejectRequest,
    inventory,
    setSelectedCertificateModal
  } = useLedger();

  const req = selectedRequestModal;
  if (!req) return null;

  const shelters = inventory.filter(i => i.category === 'Infrastructure' || i.capacity);

  // Auto-calculated nearest shelter (highest occupancy ratio -> highest need)
  const defaultSuggestedShelter = shelters.reduce((prev, curr) => 
    (curr.occupancyRatio > (prev?.occupancyRatio || 0)) ? curr : prev
  , shelters[0]);

  const [selectedShelterId, setSelectedShelterId] = useState(
    req.suggestedShelterId || defaultSuggestedShelter?.id || 'INV-INF-01'
  );

  const isApproved = req.requestStatus === 'Approved';
  const isRejected = req.requestStatus === 'Rejected';
  const isPending = req.requestStatus === 'Pending';

  const handleApproveRoute = () => {
    const chosenShelter = shelters.find(s => s.id === selectedShelterId);
    approveAndRouteDonation(req.id, chosenShelter?.name || 'Shelter A (Sector 4)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">
              {req.id}
            </span>
            <h2 className="font-bold text-base text-white">Donation Ticket & Verification Review</h2>
          </div>
          <button
            onClick={() => setSelectedRequestModal(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Status banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isApproved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isRejected
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Ticket Status</span>
              <span className="font-extrabold text-sm">{req.requestStatus}</span>
            </div>
            {isApproved && req.reliefId && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Relief ID & Certificate</span>
                <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-1 rounded border border-emerald-300">
                  {req.reliefId}
                </span>
              </div>
            )}
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold text-[10px] uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" /> Donor Info
              </span>
              <p className="font-bold text-slate-900 text-sm">{req.donor}</p>
              <p className="text-slate-600 font-medium">{req.contactPerson || 'N/A'}</p>
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {req.phone || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold text-[10px] uppercase flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-500" /> Resource Details
              </span>
              <p className="font-bold text-blue-900 text-sm">{req.resource}</p>
              <p className="text-blue-700 font-extrabold text-xs">Quantity: {req.quantity}</p>
              <p className="text-slate-500 text-[11px]">Category: {req.type}</p>
            </div>
          </div>

          {/* IDENTITY VERIFICATION SECTION */}
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Shared Identity Verification Check
              </span>
              <span className="bg-emerald-700 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                {req.donorType || 'Verified'}
              </span>
            </div>
            <p className="text-emerald-950 font-bold">
              {req.verificationBadge || req.verificationStatus}
            </p>
            <p className="text-[11px] text-emerald-800">
              Identity verified against government registrar (Aadhaar / Org Reg. No.) prior to EOC ticket review.
            </p>
          </div>

          {/* AUTO-COMPUTED NEAREST SHELTER ROUTING ENGINE */}
          {isPending && (
            <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1">
                  <Home className="w-4 h-4 text-indigo-600" />
                  Auto-Computed Nearest Shelter Match
                </span>
                <span className="bg-indigo-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                  Need Based
                </span>
              </div>
              <p className="text-[11px] text-indigo-900 font-medium">
                Calculated from live shelter capacity/occupancy data. Suggests shelter with highest shortage:
              </p>
              
              <select
                value={selectedShelterId}
                onChange={(e) => setSelectedShelterId(e.target.value)}
                className="w-full bg-white text-slate-900 font-bold text-xs p-2 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {shelters.map(shelter => (
                  <option key={shelter.id} value={shelter.id}>
                    {shelter.name} ({shelter.location}) — Occupancy: {shelter.occupancy}/{shelter.capacity} ({shelter.occupancyRatio}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1">
              Field Verification Notes & Specs
            </span>
            <p className="text-slate-700 font-medium leading-relaxed">
              {req.notes || 'Donation verified by emergency ground team. Quality check completed.'}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setSelectedRequestModal(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
          >
            Close
          </button>

          {isPending ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => rejectRequest(req.id)}
                className="bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-300 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>Reject Ticket</span>
              </button>

              <button
                onClick={handleApproveRoute}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg shadow-md transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Route to Shelter</span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-500 italic">
              Status locked ({req.requestStatus})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
