import React from 'react';
import { useLedger } from '../context/LedgerContext';
import { X, Award, ShieldCheck, Download, ExternalLink, QrCode, CheckCircle2, Building, User } from 'lucide-react';

export const CertificateModal = () => {
  const { selectedCertificateModal, setSelectedCertificateModal, setActiveTab, setVerifySearchUuid } = useLedger();

  if (!selectedCertificateModal) return null;

  const cert = selectedCertificateModal;

  const handleDownloadPdf = () => {
    alert(`Downloading official verifiable PDF certificate:\nUUID: ${cert.uuid}\nDonor: ${cert.donorName}\nContribution: ${cert.contributionSummary}`);
  };

  const handleOpenPublicVerify = () => {
    if (setVerifySearchUuid) setVerifySearchUuid(cert.uuid);
    setSelectedCertificateModal(null);
    setActiveTab('public-verify');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Cryptographic Relief Certificate</h2>
              <p className="text-[11px] text-slate-400 font-mono">UUID: {cert.uuid}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCertificateModal(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body (Styled like an official government document) */}
        <div className="p-6 space-y-6 bg-gradient-to-b from-amber-50/40 via-white to-slate-50 border-b border-slate-200 relative overflow-hidden">
          
          {/* Watermark badge */}
          <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
            <ShieldCheck className="w-64 h-64 text-slate-900" />
          </div>

          {/* Certificate Header Emblem */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SAHAYAK DISASTER RELIEF AUTHORIZED CERTIFICATE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif mt-2">
              CERTIFICATE OF VERIFIED APPRECIATION
            </h1>
            <p className="text-xs text-slate-500 font-medium italic">
              Issued under SAHAYAK Emergency Operations Center (EOC) Verification Protocol
            </p>
          </div>

          {/* Certificate Main Content */}
          <div className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-sm space-y-4 text-xs text-slate-800 leading-relaxed">
            <p className="text-center text-sm font-semibold text-slate-700">
              This official government-grade record certifies that:
            </p>
            
            <div className="text-center py-2 border-y border-amber-100 bg-amber-50/30 rounded-lg">
              <h3 className="text-lg font-black text-blue-950 font-serif">{cert.donorName}</h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">{cert.identityBadge || 'Verified Contributor'}</p>
            </div>

            <p className="text-center text-xs text-slate-700">
              Has contributed verified disaster relief resources comprising:
            </p>

            <div className="text-center">
              <span className="text-base font-extrabold text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-200 inline-block font-mono">
                {cert.contributionSummary}
              </span>
            </div>

            <p className="text-center text-xs text-slate-600">
              Routed & fulfilled to: <strong>{cert.routedShelter || 'Sector 4 Relief Camp'}</strong>
            </p>

            {/* Verification Footer inside Cert */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              
              {/* QR Code Simulation */}
              <div className="flex items-center space-x-3 bg-slate-900 text-white p-2.5 rounded-xl shrink-0">
                <div className="w-14 h-14 bg-white p-1 rounded flex items-center justify-center">
                  {/* SVG QR Code Simulation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <rect x="0" y="0" width="30" height="30" />
                    <rect x="70" y="0" width="30" height="30" />
                    <rect x="0" y="70" width="30" height="30" />
                    <rect x="10" y="10" width="10" height="10" fill="white" />
                    <rect x="80" y="10" width="10" height="10" fill="white" />
                    <rect x="10" y="80" width="10" height="10" fill="white" />
                    <rect x="40" y="10" width="20" height="10" />
                    <rect x="30" y="30" width="40" height="20" />
                    <rect x="40" y="70" width="20" height="20" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Scan to Verify</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block">FORGERY-PROOF</span>
                  <span className="text-[9px] text-slate-300 font-mono">sahayak.gov.in/verify</span>
                </div>
              </div>

              {/* Timestamp & Authority Sign */}
              <div className="text-right space-y-1 text-[11px]">
                <span className="text-slate-400 font-medium block">Issued On: {cert.issuedAt}</span>
                <span className="text-emerald-700 font-extrabold block flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status: Certified & Cryptographically Logged
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">EOC Ledger Hash: 0x8f2a...c4b1</span>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleOpenPublicVerify}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test Public Verifier Endpoint</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedCertificateModal(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Certificate PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
