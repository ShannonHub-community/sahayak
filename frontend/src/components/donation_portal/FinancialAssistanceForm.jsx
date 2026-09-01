import React, { useState } from 'react';
import { DollarSign, ShieldCheck, CreditCard, Award, CheckCircle2, Download, ExternalLink, X, FileText } from 'lucide-react';

export const FinancialAssistanceForm = ({ onSubmitSuccess, currentDonor }) => {
  const [amountPreset, setAmountPreset] = useState('10000');
  const [customAmount, setCustomAmount] = useState('10000');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [targetAccount, setTargetAccount] = useState('Chief Minister Relief Fund (CMRF)');
  const [donorName, setDonorName] = useState(currentDonor?.name || '');
  const [contactEmail, setContactEmail] = useState('donor@example.com');
  const [notes, setNotes] = useState('');

  // Payment Gateway & Certificate State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState('gateway'); // 'gateway' | 'processing' | 'success'
  const [issuedCertificate, setIssuedCertificate] = useState(null);

  const getEffectiveAmount = () => {
    if (amountPreset === 'custom') {
      return parseFloat(customAmount) || 0;
    }
    return parseFloat(amountPreset);
  };

  const handleStartPayment = (e) => {
    e.preventDefault();
    setIsPaymentModalOpen(true);
    setPaymentStep('gateway');
  };

  const handleConfirmMockPayment = () => {
    setPaymentStep('processing');
    
    setTimeout(() => {
      const effectiveAmt = getEffectiveAmount();
      const certId = `80G-2026-FIN-${Math.floor(1000 + Math.random() * 9000)}`;
      const certUuid = `550e8400-e29b-41d4-a716-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const certObj = {
        certId,
        certUuid,
        donorName: donorName || 'Generous Citizen',
        panNumber: panNumber.toUpperCase(),
        amount: effectiveAmt,
        targetAccount,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        taxDeductionSection: 'Section 80G of Income Tax Act 1961 (50% Deduction)',
        verifyUrl: `https://sahayak.gov.in/verify/${certUuid}`
      };

      setIssuedCertificate(certObj);
      setPaymentStep('success');

      onSubmitSuccess({
        category: 'Financial Assistance',
        amount: effectiveAmt,
        pan_number: panNumber,
        target_account: targetAccount,
        donor_name: donorName,
        certificate_id: certId
      });
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-200 shadow-md p-6 space-y-6">
      
      {/* Category Title Header */}
      <div className="flex items-center space-x-3 border-b border-purple-100 pb-4">
        <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-slate-900 text-lg">Financial Assistance (Direct Govt Route)</h2>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
              Purple Category Accent
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Bypasses resource-matching pipeline entirely. 100% of funds route straight to official CMRF / NDMA relief accounts with instant Section 80G certificates.
          </p>
        </div>
      </div>

      {/* Pre-answered Counter-Question Callout */}
      <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 space-y-1 text-xs text-purple-950">
        <div className="flex items-center space-x-2 font-bold text-purple-900">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>How do citizens trust where donated funds go?</span>
        </div>
        <p className="text-[11px] text-purple-800 leading-relaxed">
          Funds are <strong>never held privately</strong> — payment routes directly to official government accounts (CMRF/NDMA). An 80G tax certificate generates instantly, and public aggregate allocations update live on the site-wide Funds Tracker.
        </p>
      </div>

      {/* Main Payment Form */}
      <form onSubmit={handleStartPayment} className="space-y-4 text-xs">
        
        {/* Amount Selector */}
        <div>
          <label className="block font-bold text-slate-800 mb-2">
            Select Donation Amount (INR) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {['1000', '2500', '5000', '10000', 'custom'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountPreset(val)}
                className={`py-2.5 px-3 rounded-xl font-mono font-extrabold border text-xs transition-all cursor-pointer ${
                  amountPreset === val
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md scale-[1.02]'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {val === 'custom' ? 'Custom' : `₹${parseInt(val).toLocaleString('en-IN')}`}
              </button>
            ))}
          </div>

          {amountPreset === 'custom' && (
            <div className="mt-3">
              <input
                type="number"
                required
                min="100"
                placeholder="Enter custom amount (₹)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Target Account & PAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Target Government Account *
            </label>
            <select
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="Chief Minister Relief Fund (CMRF)">Chief Minister Relief Fund (CMRF - Maharashtra)</option>
              <option value="National Disaster Response Fund (NDRF/NDMA)">National Disaster Response Fund (NDRF / NDMA)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Donor PAN Card Number (For 80G Tax Exemption) *
            </label>
            <input
              type="text"
              required
              placeholder="ABCDE1234F"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 3: Donor Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Donor Full Name / Entity *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Shah"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Receipt Email Address *</label>
            <input
              type="email"
              required
              placeholder="donor@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200">
          <div className="flex items-center space-x-2 text-purple-900 font-bold">
            <Award className="w-5 h-5 text-purple-600" />
            <span>Instant Section 80G Tax Exemption Certificate will be generated immediately.</span>
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>Proceed to Mock Payment Gateway (₹{getEffectiveAmount().toLocaleString('en-IN')})</span>
          </button>
        </div>

      </form>

      {/* MOCK PAYMENT GATEWAY & 80G MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            
            {/* Modal Top Banner */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
                  ₹
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">SAHAYAK Mock Payment Gateway</h4>
                  <p className="text-[10px] text-slate-300">Secure Direct Routing to Govt Relief Account</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Gateway Step */}
            {paymentStep === 'gateway' && (
              <div className="p-6 space-y-4 text-xs">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center space-y-1">
                  <span className="text-slate-500 font-medium block">Total Contribution Amount</span>
                  <span className="text-2xl font-extrabold font-mono text-purple-900">
                    ₹{getEffectiveAmount().toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold block">
                    Destination: {targetAccount}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Simulate Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="border-2 border-purple-600 bg-purple-50 p-2.5 rounded-lg font-bold text-purple-900 flex items-center justify-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>UPI / GPay / PhonePe</span>
                    </button>
                    <button className="border border-slate-200 bg-slate-50 p-2.5 rounded-lg font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                      <span>NetBanking (SBI/HDFC)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleConfirmMockPayment}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
                  >
                    <span>Simulate Successful ₹{getEffectiveAmount().toLocaleString('en-IN')} Payment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Processing step */}
            {paymentStep === 'processing' && (
              <div className="p-8 text-center space-y-4 text-xs">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-base">Processing Government Payment...</h4>
                <p className="text-slate-500">Routing funds to {targetAccount} & generating Section 80G tax certificate...</p>
              </div>
            )}

            {/* Success & 80G Certificate Download step */}
            {paymentStep === 'success' && issuedCertificate && (
              <div className="p-6 space-y-4 text-xs">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">Payment Successful & Routed!</h4>
                  <p className="text-xs text-slate-500">
                    Your contribution of <strong>₹{issuedCertificate.amount.toLocaleString('en-IN')}</strong> has been credited to {issuedCertificate.targetAccount}.
                  </p>
                </div>

                {/* 80G Certificate Card */}
                <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white p-4 rounded-xl space-y-3 border border-purple-800 shadow-md">
                  <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="font-extrabold text-amber-400 text-xs">Section 80G Tax Exemption Certificate</span>
                    </div>
                    <span className="font-mono text-[10px] bg-purple-800/60 px-2 py-0.5 rounded text-purple-200">
                      {issuedCertificate.certId}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span>Donor Name:</span>
                      <strong className="text-white">{issuedCertificate.donorName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Donor PAN:</span>
                      <strong className="text-amber-300 font-mono">{issuedCertificate.panNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Exemption Benefit:</span>
                      <strong className="text-emerald-400">50% Tax Deduction</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Issuing Authority:</span>
                      <span>Govt of Maharashtra Relief Fund</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-purple-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">UUID Verified Ledger</span>
                    <button
                      onClick={() => alert(`[80G PDF ARTIFACT GENERATED]\n\nCertificate ID: ${issuedCertificate.certId}\nDonor: ${issuedCertificate.donorName}\nPAN: ${issuedCertificate.panNumber}\nAmount: ₹${issuedCertificate.amount}\nSection 80G Tax Exemption Applied.`)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download 80G PDF</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                  >
                    Done & Return to Portal
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
