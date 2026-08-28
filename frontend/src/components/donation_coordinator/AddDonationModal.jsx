import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { X, PlusCircle } from 'lucide-react';
import { LOCATIONS } from '../mock/initialData';

export const AddDonationModal = () => {
  const { isAddDonationModalOpen, setIsAddDonationModalOpen, addIncomingRequest } = useLedger();

  const [donor, setDonor] = useState('');
  const [resource, setResource] = useState('Food Rations');
  const [type, setType] = useState('Supplies');
  const [quantity, setQuantity] = useState('100 packets');
  const [numericQuantity, setNumericQuantity] = useState('100');
  const [location, setLocation] = useState('Panvel');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isAddDonationModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addIncomingRequest({
      donor: donor || 'Citizen Relief Offer',
      resource,
      type,
      quantity: `${numericQuantity} units`,
      numericQuantity,
      location,
      contactPerson: contactPerson || 'Volunteer',
      phone: phone || '+91 98765 00000',
      notes: notes || 'Verified public help request.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base text-white">Simulate Incoming Help Request</h2>
          </div>
          <button
            onClick={() => setIsAddDonationModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Donor / Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Red Cross India / Reliance Foundation"
              value={donor}
              onChange={(e) => setDonor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resource Name *</label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Food Rations">Food Rations</option>
                <option value="Medical Kits">Medical Kits</option>
                <option value="Blankets">Blankets</option>
                <option value="Drinking Water">Drinking Water</option>
                <option value="Life Jackets">Life Jackets</option>
                <option value="Medics">Medics (Personnel)</option>
                <option value="Boat Operators">Boat Operators</option>
                <option value="General Volunteers">General Volunteers</option>
                <option value="Boats">Boats (Fleet)</option>
                <option value="Ambulances">Ambulances</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Supplies">Supplies</option>
                <option value="Personnel">Personnel</option>
                <option value="Fleet">Fleet</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Numeric Quantity *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="100"
                value={numericQuantity}
                onChange={(e) => setNumericQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / Sector *</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                {LOCATIONS.filter(l => l !== 'All Sectors').map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="Name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Notes</label>
            <textarea
              rows="2"
              placeholder="Ground inspection notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddDonationModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              Submit Help Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
