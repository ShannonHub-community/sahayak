import React, { useState } from 'react';
import { Stethoscope, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Send, Calendar } from 'lucide-react';

export const MedicalSuppliesForm = ({ onSubmitSuccess, currentDonor }) => {
  const [resourceName, setResourceName] = useState('Medical Kits / Trauma Supplies');
  const [quantity, setQuantity] = useState('100');
  const [itemCondition, setItemCondition] = useState('Sealed / Manufacturer Direct');
  const [location, setLocation] = useState('Sector 4 (Relief Camp A)');
  
  // Set default expiry to 6 months in future for smooth valid default
  const defaultFutureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [expiryDate, setExpiryDate] = useState(defaultFutureDate);
  
  const [donorName, setDonorName] = useState(currentDonor?.name || '');
  const [phone, setPhone] = useState(currentDonor?.contact || '');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Validate 3-Month Expiry Rule
  const getExpiryValidation = () => {
    if (!expiryDate) return { isValid: false, message: 'Expiry date is required', daysLeft: 0 };
    
    const selected = new Date(expiryDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    const diffTime = selected - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 90) {
      return {
        isValid: false,
        message: `AUTO-REJECTED: Medication/supplies expire in ${daysLeft} days (< 90 days). SAHAYAK safety rule rejects items expiring within 3 months to prevent dumping expired drugs at relief camps.`,
        daysLeft
      };
    }

    return {
      isValid: true,
      message: `VERIFIED VALID: ${daysLeft} days of shelf-life remaining (> 90-day requirement satisfied).`,
      daysLeft
    };
  };

  const validation = getExpiryValidation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validation.isValid) {
      setErrorMsg(validation.message);
      return;
    }

    setErrorMsg('');
    const payload = {
      category: 'Medical Equipment & Supplies',
      resource_name: resourceName,
      numeric_quantity: parseInt(quantity) || 100,
      item_condition: itemCondition,
      location,
      expiry_date: expiryDate,
      donor_name: donorName || 'Medical Donor',
      phone,
      notes: notes || `Medical offer: ${resourceName}. Expiry: ${expiryDate} (${validation.daysLeft} days remaining).`
    };

    onSubmitSuccess(payload);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-6 space-y-6">
      
      {/* Category Title Header */}
      <div className="flex items-center space-x-3 border-b border-emerald-100 pb-4">
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-slate-900 text-lg">Medical Equipment & Supplies</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
              Green Category Accent
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Strict safety verification preventing expired medications or damaged surgical supplies from reaching disaster camps.
          </p>
        </div>
      </div>

      {/* Pre-answered Counter-Question Callout */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1 text-xs text-emerald-950">
        <div className="flex items-center space-x-2 font-bold text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>How do you stop expired or dangerous medical donations?</span>
        </div>
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          The backend automatically checks the expiry date and <strong>rejects any medication expiring within 3 months (90 days)</strong> at submission time — before it ever leaves the donor or reaches a shelter.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Row 1: Item Spec & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Medical Supplies / Equipment Name *
            </label>
            <select
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="Medical Kits / Trauma Supplies">Medical Kits / Emergency Trauma Supplies</option>
              <option value="Essential Antibiotics & Oral Rehydration">Essential Antibiotics & Oral Rehydration (ORS)</option>
              <option value="Bandages, Syringes & Sterile Gauze">Bandages, Syringes & Sterile Gauze</option>
              <option value="Oxygen Cylinders & Concentrators">Oxygen Cylinders & Concentrators</option>
              <option value="PPE Kits & Surgical Gloves">PPE Kits & Surgical Gloves</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Quantity (Units) *</label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-emerald-900"
            />
          </div>
        </div>

        {/* Row 2: EXPIRY DATE PICKER + LIVE VALIDATION STATE */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Medication / Product Expiry Date *
              </label>
              <p className="text-[11px] text-slate-500">Must have at least 90 days (3 months) validity remaining from today.</p>
            </div>

            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shrink-0"
            />
          </div>

          {/* Validation Alert Box */}
          <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2.5 transition-all ${
            validation.isValid
              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
              : 'bg-rose-100 border-rose-300 text-rose-950 font-medium'
          }`}>
            {validation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            )}
            <div>
              <span className="font-extrabold block">{validation.isValid ? '3-Month Expiry Rule Passed' : 'Validation Failed: Rejected'}</span>
              <span className="text-[11px] leading-snug">{validation.message}</span>
            </div>
          </div>
        </div>

        {/* Row 3: Donor Name, Phone, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Donor Name / Pharma Partner</label>
            <input
              type="text"
              placeholder="e.g. Cipla Care / Apollo Pharmacy"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Contact Phone</label>
            <input
              type="text"
              placeholder="+91 98765 11111"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Condition & Storage</label>
            <select
              value={itemCondition}
              onChange={(e) => setItemCondition(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs cursor-pointer"
            >
              <option value="Sealed / Manufacturer Direct">Sealed / Manufacturer Direct</option>
              <option value="Cold Chain Maintained (2-8°C)">Cold Chain Maintained (2-8°C)</option>
              <option value="Unopened Hospital Supplies">Unopened Hospital Supplies</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">Logistics / Batch Notes</label>
          <textarea
            rows="2"
            placeholder="Batch number, temperature maintenance notes, or hospital dispatch details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={!validation.isValid}
            className={`font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 ${
              validation.isValid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Medical Offer to EOC Pipeline</span>
          </button>
        </div>

      </form>

    </div>
  );
};
