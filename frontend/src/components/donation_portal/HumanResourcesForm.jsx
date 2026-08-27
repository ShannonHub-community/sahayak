import React, { useState } from 'react';
import { Users, ShieldCheck, Clock, Camera, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

export const HumanResourcesForm = ({ onSubmitSuccess, currentDonor }) => {
  const [skillCategory, setSkillCategory] = useState('Medical');
  const [availabilityWindow, setAvailabilityWindow] = useState('Immediate 24-48 Hours');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('Sector 4 (Relief Camp A)');
  const [volunteerName, setVolunteerName] = useState(currentDonor?.name || '');
  const [phone, setPhone] = useState(currentDonor?.contact || '');
  const [aadhaar, setAadhaar] = useState(currentDonor?.verification_ref || 'XXXX-XXXX-9988');
  const [medicalConditions, setMedicalConditions] = useState(currentDonor?.medical_conditions || 'None');
  const [photoUrl, setPhotoUrl] = useState(currentDonor?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      category: 'Human Resources',
      skill_category: skillCategory,
      availability_window: availabilityWindow,
      quantity: parseInt(quantity) || 1,
      location,
      donor_name: volunteerName || 'Volunteer Donor',
      identity_number: aadhaar,
      phone,
      medical_conditions: medicalConditions,
      notes: notes || `Volunteer offer [${skillCategory}]. Shift availability: ${availabilityWindow}`
    };

    onSubmitSuccess(payload);
    setIsSubmitted(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-6 space-y-6">
      
      {/* Category Title Header */}
      <div className="flex items-center space-x-3 border-b border-blue-100 pb-4">
        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-slate-900 text-lg">Human Resources & Skilled Volunteers</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
              Blue Category Accent
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Structures volunteer deployments by skill taxonomy & shift availability windows to avoid uncoordinated personnel liability.
          </p>
        </div>
      </div>

      {/* Pre-answered Counter-Question Callout */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-1 text-xs text-blue-950">
        <div className="flex items-center space-x-2 font-bold text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Why capture photo, Aadhaar & medical conditions?</span>
        </div>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          Disasters are chaotic — if a volunteer goes missing or gets injured in a collapse zone, the EOC control room needs exact medical & identity details to <em>rescue the rescuer</em>.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Row 1: Skill Dropdown & Availability Window */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Volunteer Skill Specialty *
            </label>
            <select
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="Medical">Medical (Doctors / Paramedics / Nurses)</option>
              <option value="Logistics">Logistics (Supply Chain / Warehouse / Truck Drivers)</option>
              <option value="Technical">Technical (Structural Engineers / Telecom / Mechanics)</option>
              <option value="General Relief">General Relief (Shelter Management / Food Distribution)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Auto-maps onto fixed personnel taxonomy: {skillCategory === 'Medical' ? 'Medics & Paramedics' : skillCategory === 'Logistics' ? 'Supply Chain & Logistics' : skillCategory === 'Technical' ? 'Structural & Tech Engineers' : 'General Shelter Volunteers'}
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Availability Window & Shift Rotation *
            </label>
            <select
              value={availabilityWindow}
              onChange={(e) => setAvailabilityWindow(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="Immediate 24-48 Hours">Immediate 24-48 Hours (Emergency Response)</option>
              <option value="3-7 Day Full Shift">3-7 Day Full Shift (On-site Camp)</option>
              <option value="Weekend Shift Rotation">Weekend Shift Rotation</option>
              <option value="On-Call Emergency Duty">On-Call Emergency Duty</option>
            </select>
          </div>
        </div>

        {/* Row 2: Name, Phone, Aadhaar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Volunteer Name *</label>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Contact Phone *</label>
            <input
              type="text"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Aadhaar Ref / ID *</label>
            <input
              type="text"
              required
              placeholder="XXXX-XXXX-9988"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-blue-900"
            />
          </div>
        </div>

        {/* Row 3: Photo Preview, Medical Conditions, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Target Sector / Camp</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs cursor-pointer"
            >
              <option value="Sector 4 (Relief Camp A)">Sector 4 (Relief Camp A)</option>
              <option value="Kharghar Community Center">Kharghar Community Center</option>
              <option value="Panvel High School">Panvel High School</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Pre-existing Medical Conditions</label>
            <input
              type="text"
              placeholder="Asthma / Diabetes / None"
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Volunteer Count</label>
            <input
              type="number"
              min="1"
              max="50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">Specialized Equipment or Certification Notes</label>
          <textarea
            rows="2"
            placeholder="e.g. Certified ACLS paramedic, brought own trauma kit and emergency radio..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit Volunteer Offer to EOC Pipeline</span>
          </button>
        </div>

      </form>

    </div>
  );
};
