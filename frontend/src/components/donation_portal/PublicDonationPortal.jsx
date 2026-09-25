import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLedger } from '../context/LedgerContext';
import { Heart, Radio, Send, CheckCircle2, ShieldCheck, AlertCircle, Package, Users, MapPin, ArrowRight, Sparkles, HandHeart, Award } from 'lucide-react';
import { LOCATIONS } from '../mock/initialData';

export const PublicDonationPortal = () => {
  const {
    publicNeeds,
    addIncomingRequest,
    pledgedNeed,
    setPledgedNeed,
    requests,
    inventory
  } = useLedger();

  // Form State
  const [donor, setDonor] = useState('');
  const [resource, setResource] = useState('Food Rations');
  const [type, setType] = useState('Supplies');
  const [numericQuantity, setNumericQuantity] = useState('100');
  const [location, setLocation] = useState('Panvel');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);

  // If pledgedNeed was clicked from live needs
  useEffect(() => {
    if (pledgedNeed) {
      if (pledgedNeed.resource) setResource(pledgedNeed.resource);
      if (pledgedNeed.quantity) setNumericQuantity(pledgedNeed.quantity.toString());
      if (pledgedNeed.location) setLocation(pledgedNeed.location);
      setNotes(`Fulfilling urgent public need: ${pledgedNeed.title} (${pledgedNeed.description})`);
    }
  }, [pledgedNeed]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newReqId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    addIncomingRequest({
      donor: donor || 'Public Community Contributor',
      resource,
      type,
      quantity: `${numericQuantity} units`,
      numericQuantity,
      location,
      contactPerson: contactPerson || 'Volunteer',
      phone: phone || '+91 98765 12345',
      notes: notes || 'Submitted directly via SAHAYAK Public Donation Portal.'
    });

    setLastSubmittedId(newReqId);
    setSubmittedSuccess(true);

    // Reset form
    setDonor('');
    setContactPerson('');
    setPhone('');
    setNotes('');
    setPledgedNeed(null);
  };

  const handlePledgeNeed = (need) => {
    setPledgedNeed(need);
    setResource(need.resource || 'Life Jackets');
    setNumericQuantity((need.quantity || 50).toString());
    setLocation(need.location || 'Sector 4');
    setNotes(`Direct response to emergency broadcast: "${need.title}" for ${need.location}`);
    
    // Scroll smoothly to donation form
    const formElement = document.getElementById('public-donation-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const approvedRequests = requests.filter(r => r.requestStatus === 'Approved');
  const totalApprovedUnits = approvedRequests.reduce((acc, r) => acc + (r.numericQuantity || 0), 0);

  return (
    <div className="max-w-[1700px] mx-auto p-4 space-y-6">
      
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
              <HandHeart className="w-4 h-4 text-rose-400" />
              <span>SAHAYAK Community Relief Channel</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              SAHAYAK Public Donation Portal
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
              Direct public gateway connecting citizen & corporate donors with the SAHAYAK Emergency Operations Center (EOC). Submit help offers directly to verified EOC coordinators to replenish live disaster inventory.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0 text-xs">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center">
              <span className="text-slate-400 font-medium block">Total Units Inducted</span>
              <span className="text-emerald-400 font-mono text-xl font-extrabold">{totalApprovedUnits + 850}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center">
              <span className="text-slate-400 font-medium block">Active Relief IDs</span>
              <span className="text-blue-400 font-mono text-xl font-extrabold">{approvedRequests.length + 14}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center">
              <span className="text-slate-400 font-medium block">Open Public Needs</span>
              <span className="text-amber-400 font-mono text-xl font-extrabold">{publicNeeds.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center">
              <span className="text-slate-400 font-medium block">EOC Status</span>
              <span className="text-emerald-400 font-bold block text-xs mt-1">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION CARD: VERIFY DONATION CERTIFICATE */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm sm:text-base">
                Verify a Donation Certificate
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                Public Ledger
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Validate cryptographic proof of donation allocation and tax receipts
            </p>
          </div>
        </div>
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify Certificate Authenticity</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* MAIN TWO-COLUMN PORTAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (7 cols): LIVE BROADCASTED NEEDS & PORTAL FORM */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: URGENT PUBLIC BROADCASTS FROM EOC */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">
                    Urgent Emergency Needs Broadcasted by EOC
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified requests dispatched by disaster coordinators requiring public assistance
                  </p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                {publicNeeds.length} Live Needs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {publicNeeds.map((need) => (
                <div
                  key={need.id}
                  className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md ${
                    need.urgency === 'Critical'
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        need.urgency === 'Critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {need.urgency}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {need.location}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{need.title}</h3>
                    <p className="text-xs text-slate-700 font-medium mt-1 leading-snug">
                      {need.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Req: {need.quantity} {need.resource}
                    </span>
                    <button
                      onClick={() => handlePledgeNeed(need)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Donate This Item</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* SECTION 2: PUBLIC DONATION OFFER FORM */}
          <div id="public-donation-form" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">
                  Offer Public Help / Submit Donation
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Your offer will be transmitted instantly to the Left Panel (Incoming Help Requests) for EOC verification & induction.
                </p>
              </div>
            </div>

            {/* Success Alert */}
            {submittedSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h4 className="font-bold text-sm">Help Offer Transmitted to EOC Gatekeeper!</h4>
                </div>
                <p className="text-xs text-slate-700">
                  Your donation proposal has been dispatched to the EOC Donation Coordinator.
                </p>
                <div className="pt-1 flex items-center">
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Submit Another Offer
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              {pledgedNeed && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-bold">Fulfilling Broadcasted Need: {pledgedNeed.title} ({pledgedNeed.location})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPledgedNeed(null)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Clear pre-fill
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Donor / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Motors CSR / Reliance Foundation / Helping Hands"
                    value={donor}
                    onChange={(e) => setDonor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Target Sector / Delivery Hub *
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-black focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer [&>option]:text-black"
                  >
                    {LOCATIONS.filter(l => l !== 'All Sectors').map(loc => (
                      <option key={loc} value={loc} className="text-black">{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Resource Offered *
                  </label>
                  <select
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-black focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer [&>option]:text-black"
                  >
                    <option value="Food Rations" className="text-black">Food Rations</option>
                    <option value="Medical Kits" className="text-black">Medical Kits</option>
                    <option value="Blankets" className="text-black">Blankets</option>
                    <option value="Drinking Water" className="text-black">Drinking Water</option>
                    <option value="Life Jackets" className="text-black">Life Jackets</option>
                    <option value="Medics" className="text-black">Medics (Personnel)</option>
                    <option value="Boat Operators" className="text-black">Boat Operators</option>
                    <option value="General Volunteers" className="text-black">General Volunteers</option>
                    <option value="Boats" className="text-black">Boats (Fleet)</option>
                    <option value="Ambulances" className="text-black">Ambulances</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Category *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-black focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer [&>option]:text-black"
                  >
                    <option value="Supplies" className="text-black">Supplies</option>
                    <option value="Personnel" className="text-black">Personnel</option>
                    <option value="Fleet" className="text-black">Fleet</option>
                    <option value="Equipment" className="text-black">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Numeric Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100"
                    value={numericQuantity}
                    onChange={(e) => setNumericQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="Contact Lead Name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Phone / Emergency Contact
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Donation Specification & Logistics Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Provide specifications, packaging details, or transport readiness..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Offer to EOC Gatekeeper</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        
        {/* RIGHT COLUMN (5 cols): PUBLIC TRANSPARENCY FEED & IMPACT LEDGER */}
        <div className="lg:col-span-5 space-y-6">

          {/* COMMUNITY TRANSPARENCY FEED */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Inducted Relief & Public Audit Feed
                </h3>
              </div>
              <span className="text-emerald-700 bg-emerald-50 text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-200">
                Verified Ledger
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Every approved donation receives a unique public <strong>Relief ID</strong> ensuring full transparency from induction to deployment.
            </p>

            {/* List of approved items */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {approvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{req.donor}</span>
                    <span className="font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      {req.reliefId || 'REL-2026-0982'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Offered: <strong className="text-slate-900">{req.quantity} {req.resource}</strong></span>
                    <span>Location: <strong>{req.location}</strong></span>
                  </div>

                  <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified & Added to Live Matrix
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{req.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Link to Verifier */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Have a certificate or Relief ID?</span>
              <Link
                href="/verify"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify Authenticity</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* EOC OPERATIONAL GUIDELINES FOR CITIZENS */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-blue-400 font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm text-white font-extrabold">Public Donation Standards</h4>
            </div>
            <ul className="space-y-2 text-slate-300 font-medium">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>All rations must be sealed and non-perishable for immediate depot induction.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>Medical kits must meet standard disaster response kit specifications.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>Volunteers undergo quick identity verification before assignment to Sector Shelters.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
