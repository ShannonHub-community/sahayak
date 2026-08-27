import React, { useState } from 'react';
import { User, Building, ShieldCheck, Camera, CheckCircle2, X } from 'lucide-react';

export const DonorRegistrationModal = ({ isOpen, onClose, onRegisterSuccess, currentDonor }) => {
  const [donorType, setDonorType] = useState('individual'); // 'individual' | 'organization'
  
  // Individual Fields
  const [name, setName] = useState(currentDonor?.name || '');
  const [contact, setContact] = useState(currentDonor?.contact || '');
  const [age, setAge] = useState(currentDonor?.age || '28');
  const [gender, setGender] = useState(currentDonor?.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(currentDonor?.blood_group || 'O+');
  const [medicalConditions, setMedicalConditions] = useState(currentDonor?.medical_conditions || 'None');
  const [photoUrl, setPhotoUrl] = useState(currentDonor?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [aadhaarNumber, setAadhaarNumber] = useState(currentDonor?.verification_ref || '9876-5432-1098');

  // Organization Fields
  const [headOwnerName, setHeadOwnerName] = useState(currentDonor?.head_owner_name || '');
  const [coordinatorName, setCoordinatorName] = useState(currentDonor?.coordinator_name || '');
  const [coordinatorContact, setCoordinatorContact] = useState(currentDonor?.coordinator_contact || '');
  const [orgLocation, setOrgLocation] = useState(currentDonor?.org_location || 'Mumbai Hub');
  const [orgRegNo, setOrgRegNo] = useState(currentDonor?.verification_ref || 'NGO-MH-2022-8841');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = donorType === 'individual' ? {
      id: `DONOR-${Date.now()}`,
      type: 'individual',
      name: name || 'Citizen Donor',
      contact: contact || '+91 98765 43210',
      age: parseInt(age) || 28,
      gender,
      blood_group: bloodGroup,
      medical_conditions: medicalConditions,
      photo_url: photoUrl,
      verification_ref: aadhaarNumber,
      verification_status: 'verified',
      badge: `Verified Individual (Aadhaar: ${aadhaarNumber})`
    } : {
      id: `DONOR-ORG-${Date.now()}`,
      type: 'organization',
      name: name || 'Relief Organization',
      contact: contact || '+91 98765 88888',
      head_owner_name: headOwnerName,
      coordinator_name: coordinatorName || name,
      coordinator_contact: coordinatorContact || contact,
      org_location: orgLocation,
      verification_ref: orgRegNo,
      verification_status: 'verified',
      badge: `Verified Org (Reg #: ${orgRegNo})`
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onRegisterSuccess(payload);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">One-Time Donor Profile Registration</h3>
              <p className="text-xs text-slate-300">Creates a reusable verified profile for fast contribution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Org vs Individual Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDonorType('individual')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold transition-all ${
                donorType === 'individual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Individual Donor</span>
            </button>

            <button
              type="button"
              onClick={() => setDonorType('organization')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold transition-all ${
                donorType === 'organization'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Organization / NGO</span>
            </button>
          </div>

          {/* Form Fields - Individual */}
          {donorType === 'individual' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs cursor-pointer"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs cursor-pointer font-bold text-rose-700"
                  >
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Aadhaar Number (Mock Verification) *</label>
                  <input
                    type="text"
                    required
                    placeholder="XXXX-XXXX-9988"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Medical Conditions / Allergies</label>
                  <input
                    type="text"
                    placeholder="None / Asthma / Diabetes"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center space-x-3">
                <img src={photoUrl} alt="Volunteer Preview" className="w-10 h-10 rounded-full object-cover border border-blue-400" />
                <div className="text-blue-900">
                  <span className="font-bold block text-xs">Identity Photo & Rescue Safety Badge</span>
                  <span className="text-[11px] text-blue-700">Capturing exact identity details ensures control room safety for rescue officers during deployments.</span>
                </div>
              </div>
            </div>
          ) : (
            /* Form Fields - Organization */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Helping Hands Foundation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">NGO / Trust Reg. No. / CSR ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="REG-MH-2022-8841"
                    value={orgRegNo}
                    onChange={(e) => setOrgRegNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Head / Trustee Owner Name</label>
                  <input
                    type="text"
                    placeholder="Head Executive Officer"
                    value={headOwnerName}
                    onChange={(e) => setHeadOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Org Base Location</label>
                  <input
                    type="text"
                    placeholder="Mumbai / Navi Mumbai Hub"
                    value={orgLocation}
                    onChange={(e) => setOrgLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Field Coordinator Lead Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Coordinator Lead"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Coordinator Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98000 11111"
                    value={coordinatorContact}
                    onChange={(e) => setCoordinatorContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Save Verified Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
