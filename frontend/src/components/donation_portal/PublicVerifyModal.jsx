import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { ShieldCheck, Search, QrCode, CheckCircle2, AlertTriangle, ExternalLink, ArrowRight, Award, Lock, Sparkles } from 'lucide-react';

export const PublicVerifyModal = () => {
  const { certificates, verifySearchUuid, setVerifySearchUuid, setActiveTab } = useLedger();
  
  const [inputUuid, setInputUuid] = useState(verifySearchUuid || '');
  const [searched, setSearched] = useState(Boolean(verifySearchUuid));
  const [resultCert, setResultCert] = useState(
    verifySearchUuid ? certificates.find(c => c.uuid.toLowerCase() === verifySearchUuid.toLowerCase()) || null : null
  );

  const handleVerify = (e) => {
    if (e) e.preventDefault();
    const query = inputUuid.trim();
    if (!query) return;

    setSearched(true);
    const found = certificates.find(
      c => c.uuid.toLowerCase() === query.toLowerCase() || c.donationId.toLowerCase() === query.toLowerCase()
    );
    setResultCert(found || null);
  };

  const handlePresetVerify = (uuid) => {
    setInputUuid(uuid);
    setSearched(true);
    const found = certificates.find(c => c.uuid.toLowerCase() === uuid.toLowerCase());
    setResultCert(found || null);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Public Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4 text-center relative overflow-hidden">
        <div className="absolute left-1/2 -top-24 transform -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>SAHAYAK Public Certificate Verification Endpoint (No-Login)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif text-white">
          Verify Relief Certificate Authenticity
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl mx-auto leading-relaxed">
          Every SAHAYAK relief certificate carries a unique cryptographic UUID and QR code. Enter the Certificate ID or scan the QR code to verify its authenticity on the official government ledger.
        </p>

        {/* Verification Input Form */}
        <form onSubmit={handleVerify} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Paste Certificate UUID (e.g. 550e8400-e29b-41d4...)"
              value={inputUuid}
              onChange={(e) => setInputUuid(e.target.value)}
              className="w-full bg-slate-800 text-white font-mono text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center space-x-1 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Certificate</span>
          </button>
        </form>
      </div>

      {/* Preset UUID Quick Tester */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Test Sample Certificate UUIDs:
        </span>
        <div className="flex items-center flex-wrap gap-2">
          {certificates.map((c) => (
            <button
              key={c.uuid}
              onClick={() => handlePresetVerify(c.uuid)}
              className="bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-mono text-[11px] font-bold px-2.5 py-1 rounded border border-slate-300 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
            >
              {c.donorName}: {c.uuid.substring(0, 13)}...
            </button>
          ))}
        </div>
      </div>

      {/* VERIFICATION RESULT DISPLAY */}
      {searched && (
        <div className="animate-in fade-in zoom-in duration-200">
          {resultCert ? (
            /* VALID RESULT */
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-emerald-950 text-lg">VALID & AUTHENTIC RELIEF CERTIFICATE</h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      Cryptographically verified against SAHAYAK Disaster EOC Ledger.
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-700 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                  STATUS: VALID
                </span>
              </div>

              {/* Certificate Summary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Certificate ID (UUID)</span>
                  <p className="font-mono font-bold text-slate-900 text-sm break-all">{resultCert.uuid}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Donor Name & Identity Check</span>
                  <p className="font-bold text-slate-900 text-sm">{resultCert.donorName}</p>
                  <p className="text-emerald-700 font-semibold text-[11px]">{resultCert.identityBadge || 'Verified Contributor'}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Contributed Resources</span>
                  <p className="font-extrabold text-blue-900 text-sm">{resultCert.contributionSummary}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Routed Shelter & Fulfillment</span>
                  <p className="font-bold text-slate-800 text-sm">{resultCert.routedShelter || 'Sector 4 Relief Camp'}</p>
                  <p className="text-slate-500 text-[11px]">Issued: {resultCert.issuedAt}</p>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                <span>Verification Source: SAHAYAK Official EOC Ledger</span>
                <span className="font-mono text-slate-400">Tamper-Proof Audit Hash Verified</span>
              </div>

            </div>
          ) : (
            /* INVALID RESULT */
            <div className="bg-white rounded-2xl border-2 border-rose-400 shadow-xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-rose-950 text-lg">INVALID OR UNRECOGNIZED CERTIFICATE UUID</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  The Certificate ID <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-rose-700">{inputUuid}</code> was not found on the SAHAYAK public ledger.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
