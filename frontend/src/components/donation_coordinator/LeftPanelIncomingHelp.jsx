import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { Inbox, CheckCircle, XCircle, Eye, Plus, ShieldCheck, Filter, Search, UserCheck, Award, Building, User } from 'lucide-react';

export const LeftPanelIncomingHelp = () => {
  const {
    requests,
    approveAndRouteDonation,
    rejectRequest,
    setSelectedRequestModal,
    setIsAddDonationModalOpen,
    selectedSector,
    setSelectedCertificateModal,
    certificates
  } = useLedger();

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSector = selectedSector === 'All Sectors' || req.location === selectedSector;
    const matchesStatus = statusFilter === 'All' || req.requestStatus === statusFilter;
    const matchesSearch =
      req.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSector && matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter(r => r.requestStatus === 'Pending').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-900 text-base">Incoming Help Tickets</h2>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-900 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Identity-verified tickets for EOC review & shelter routing
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddDonationModalOpen(true)}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          title="Simulate incoming help offer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xl:inline">Submit Ticket</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 bg-slate-50/50 border-b border-slate-200 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search donor, Aadhaar/Reg No, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            {filteredRequests.length} item(s)
          </span>
        </div>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No donation tickets match current filters.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isApproved = req.requestStatus === 'Approved';
            const isRejected = req.requestStatus === 'Rejected';
            const isPending = req.requestStatus === 'Pending';
            const isDemoTarget = req.id === 'REQ-2026-1048';

            const matchingCert = certificates.find(c => c.donationId === req.id || c.uuid === req.certificateUuid);

            return (
              <div
                key={req.id}
                className={`rounded-lg border p-3 transition-all relative ${
                  isDemoTarget && isPending
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-400/30'
                    : isApproved
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isRejected
                    ? 'border-slate-200 bg-slate-50 opacity-75'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {req.id}
                      </span>
                      {/* Identity Type Pill */}
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {req.donorType || 'Organization'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                      {req.donor}
                    </h3>
                  </div>

                  {/* Request Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {req.requestStatus}
                  </span>
                </div>

                {/* Content info */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600 my-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Resource & Type</span>
                    <span className="font-semibold text-slate-800">{req.resource}</span>
                    <span className="text-slate-400 text-[11px]"> ({req.type})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Quantity</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                      {req.quantity}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Location</span>
                    <span className="font-medium text-slate-700">{req.location}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Identity Check</span>
                    <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      {req.identityType ? `${req.identityType}` : 'Verified'}
                    </span>
                  </div>
                </div>

                {/* If approved, show Relief ID and Certificate button */}
                {isApproved && (
                  <div className="my-2 p-2 bg-emerald-100/80 border border-emerald-300 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-950">
                      <span className="font-semibold text-[11px]">Relief ID Generated:</span>
                      <span className="font-mono font-extrabold bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {req.reliefId || 'REL-2026-1048'}
                      </span>
                    </div>

                    {matchingCert && (
                      <button
                        onClick={() => setSelectedCertificateModal(matchingCert)}
                        className="w-full mt-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] py-1 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Cryptographic Certificate & QR</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => setSelectedRequestModal(req)}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Ticket</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => rejectRequest(req.id)}
                          className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-xs font-semibold px-2 py-1 rounded transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Reject ticket"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Reject</span>
                        </button>
                        
                        <button
                          onClick={() => approveAndRouteDonation(req.id, 'Shelter A (Sector 4)')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Approve & Route to Shelter"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Route</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Fulfilled
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
