import React, { useState, useEffect } from 'react';
import { Utensils, ShieldCheck, Clock, AlertTriangle, CheckCircle2, XCircle, Send, PackageCheck } from 'lucide-react';

export const FoodMealsForm = ({ onSubmitSuccess, currentDonor }) => {
  const [foodCategory, setFoodCategory] = useState('Cooked Meals'); // 'Cooked Meals' | 'Dry Rations'
  const [resourceName, setResourceName] = useState('Hot Cooked Meal Packets');
  const [quantity, setQuantity] = useState('150');
  const [location, setLocation] = useState('Panvel High School Shelter');
  
  // Set default prep timestamp to 1 hour ago
  const defaultPrepTime = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const [prepTimestamp, setPrepTimestamp] = useState(defaultPrepTime);
  
  const [donorName, setDonorName] = useState(currentDonor?.name || '');
  const [phone, setPhone] = useState(currentDonor?.contact || '');
  const [notes, setNotes] = useState('');

  // Live FSSAI Countdown & Validation
  const getFSSAIValidation = () => {
    if (foodCategory === 'Dry Rations') {
      return {
        isValid: true,
        isCooked: false,
        message: 'Dry Rations (Rice, Pulses, Biscuits, Water) are highly encouraged! Unlimited shelf-life stability.',
        timeRemainingText: 'Unlimited Shelf Life'
      };
    }

    if (!prepTimestamp) {
      return { isValid: false, isCooked: true, message: 'Preparation timestamp is required for cooked meals.', timeRemainingText: 'N/A' };
    }

    const prepTime = new Date(prepTimestamp).getTime();
    const now = new Date().getTime();
    const elapsedMs = now - prepTime;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    const fssaiMaxHours = 6.0; // FSSAI 4-6 hour safety window
    const hoursRemaining = fssaiMaxHours - elapsedHours;

    if (elapsedHours < 0) {
      return { isValid: false, isCooked: true, message: 'Preparation time cannot be in the future.', timeRemainingText: 'Invalid Time' };
    }

    if (elapsedHours > fssaiMaxHours) {
      return {
        isValid: false,
        isCooked: true,
        message: `AUTO-REJECTED: Food prepared ${elapsedHours.toFixed(1)} hours ago (> 6-hour FSSAI limit). Risk of food spoilage/poisoning in humid shelter conditions. Please donate dry rations instead.`,
        timeRemainingText: 'EXPIRED (WINDOW PASSED)'
      };
    }

    const minsRemaining = Math.floor((hoursRemaining % 1) * 60);
    const hrsRemainingInt = Math.floor(hoursRemaining);

    return {
      isValid: true,
      isCooked: true,
      message: `FSSAI SAFE: Prepared ${elapsedHours.toFixed(1)}h ago. Must reach shelter within ${hrsRemainingInt}h ${minsRemaining}m before 6-hour window closes.`,
      timeRemainingText: `${hrsRemainingInt}h ${minsRemaining}m remaining`
    };
  };

  const validation = getFSSAIValidation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validation.isValid) return;

    const payload = {
      category: 'Food & Meals',
      food_category: foodCategory,
      resource_name: resourceName,
      numeric_quantity: parseInt(quantity) || 100,
      location,
      prep_timestamp: foodCategory === 'Cooked Meals' ? prepTimestamp : null,
      donor_name: donorName || 'Community Kitchen / Donor',
      phone,
      notes: notes || `Food offer: ${foodCategory} (${resourceName}). Prep: ${prepTimestamp || 'N/A Dry Rations'}.`
    };

    onSubmitSuccess(payload);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-md p-6 space-y-6">
      
      {/* Category Title Header */}
      <div className="flex items-center space-x-3 border-b border-amber-100 pb-4">
        <div className="p-3 bg-amber-600 text-white rounded-xl shadow-md">
          <Utensils className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-slate-900 text-lg">Food & Meals Relief</h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
              Orange Category Accent
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            FSSAI 4–6 hour shelf-life window validation preventing secondary food poisoning crises in disaster camps.
          </p>
        </div>
      </div>

      {/* Pre-answered Counter-Question Callout */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs text-amber-950">
        <div className="flex items-center space-x-2 font-bold text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>How do you prevent food poisoning from donated meals?</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Cooked meals require a preparation timestamp; if it can't reach a shelter within the <strong>4–6 hour FSSAI shelf-life standard</strong>, the system rejects the offer outright. Dry rations are encouraged instead.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Toggle: Cooked Meals vs Dry Rations */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setFoodCategory('Cooked Meals');
              setResourceName('Hot Cooked Meal Packets');
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold transition-all ${
              foodCategory === 'Cooked Meals'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Cooked Meals (FSSAI 4-6h Window)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFoodCategory('Dry Rations');
              setResourceName('Dry Ration Kits (Rice/Wheat/Oil)');
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold transition-all ${
              foodCategory === 'Dry Rations'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Dry Rations (Encouraged)</span>
          </button>
        </div>

        {/* Row 1: Item Spec & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Food Item Description *
            </label>
            <input
              type="text"
              required
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Quantity (Packets/Kits) *</label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-amber-900"
            />
          </div>
        </div>

        {/* Cooked Meal FSSAI Timestamp & Countdown */}
        {foodCategory === 'Cooked Meals' ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Food Preparation Timestamp *
                </label>
                <p className="text-[11px] text-slate-500">Exact time food was finished cooking</p>
              </div>

              <input
                type="datetime-local"
                required
                value={prepTimestamp}
                onChange={(e) => setPrepTimestamp(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer shrink-0"
              />
            </div>

            {/* FSSAI Live Validation Alert */}
            <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2.5 transition-all ${
              validation.isValid
                ? 'bg-amber-100/70 border-amber-300 text-amber-950'
                : 'bg-rose-100 border-rose-300 text-rose-950 font-medium'
            }`}>
              {validation.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
              )}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold">{validation.isValid ? 'FSSAI Shelf-Life Window Active' : 'Validation Failed: Rejected'}</span>
                  <span className="font-mono text-[11px] font-extrabold bg-white px-2 py-0.5 rounded border border-amber-300">
                    Countdown: {validation.timeRemainingText}
                  </span>
                </div>
                <span className="text-[11px] leading-snug block mt-1">{validation.message}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold block">Dry Rations Preferred</span>
              <span className="text-[11px]">Dry rations (Rice, Wheat, Dal, Biscuits, Sealed Water) bypass the 6-hour cooked window and can be stored in emergency relief depots for months.</span>
            </div>
          </div>
        )}

        {/* Row 3: Donor Name, Phone, Target Sector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Kitchen / Org Name</label>
            <input
              type="text"
              placeholder="e.g. Akshaya Patra / Iskcon Kitchen"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Contact Phone</label>
            <input
              type="text"
              placeholder="+91 98765 22222"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Target Sector / Delivery Hub</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs cursor-pointer"
            >
              <option value="Panvel High School Shelter">Panvel High School Shelter</option>
              <option value="Sector 4 Relief Camp">Sector 4 Relief Camp</option>
              <option value="Kharghar Community Center">Kharghar Community Center</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">Special Packaging / Transit Instructions</label>
          <textarea
            rows="2"
            placeholder="Thermal insulated containers, vegetarian food only, ready for distribution..."
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
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Food Offer to EOC Pipeline</span>
          </button>
        </div>

      </form>

    </div>
  );
};
