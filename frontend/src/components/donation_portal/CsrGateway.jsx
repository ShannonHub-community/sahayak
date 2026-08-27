import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { Building, Download, ShieldCheck, Plus, CheckCircle2, Award, FileText, ExternalLink, BarChart3, Users } from 'lucide-react';

export const CsrGateway = () => {
  const { csrPartners, addCsrPartner, generateCsrImpactReport } = useLedger();
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [category, setCategory] = useState('Technology & Services');
  const [contactEmail, setContactEmail] = useState('');

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    addCsrPartner({
      companyName,
      cinNumber,
      category,
      contactEmail
    });
    setCompanyName('');
    setCinNumber('');
    setContactEmail('');
    setIsRegisterOpen(false);
  };

  return (
    <div className="max-w-[1700px] mx-auto p-4 sm:p-6 space-y-6">
      
      {/* CSR HERO BANNER */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-8 border border-indigo-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>SAHAYAK CSR Incentive & Gateway Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
              Corporate Social Responsibility (CSR) Gateway
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
              Disasters draw genuine willingness to help from companies. The CSR Gateway provides registered corporate partners with government-grade, verifiable proof of their contributions and downloadable **Impact Reports**.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Corporate CSR Partner</span>
          </button>
        </div>
      </div>


      {/* CSR PARTNER LIST GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Registered Corporate CSR Partners
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {csrPartners.length} Active Partners
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {csrPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{partner.companyName}</h3>
                    <p className="font-mono text-[11px] text-slate-500 font-bold">CIN: {partner.cinNumber}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Verified CSR Partner
                  </span>
                </div>

                <div className="space-y-2 text-xs my-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Contributed Units:</span>
                    <span className="font-mono font-extrabold text-indigo-900 text-sm">{partner.totalContributedUnits.toLocaleString()} units</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Contributions Count:</span>
                    <span className="font-bold text-slate-800">{partner.contributionsCount} Disaster Transfers</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/60 leading-relaxed">
                  {partner.impactSummary}
                </p>
              </div>

              {/* Action Button: Download Impact Report */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => generateCsrImpactReport(partner)}
                  className="w-full bg-indigo-900 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Download Impact Report (PDF)</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>


      {/* REGISTER MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Register Corporate CSR Partner</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infosys Ltd / Mahindra & Mahindra"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate CIN Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L85110KA1981PLC013115"
                  value={cinNumber}
                  onChange={(e) => setCinNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate Sector / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Information Technology / Energy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate Contact Email</label>
                <input
                  type="email"
                  placeholder="csr@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
