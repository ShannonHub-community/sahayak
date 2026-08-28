import React from 'react';
import { 
  HeartPulse, 
  Users, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Activity, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import type { FamilyMember } from '@/types/registration';

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
];

const CHRONIC_DISEASES = [
  { id: 'Diabetes', label: 'Diabetes (Insulin / Medication dependent)' },
  { id: 'Hypertension & Cardiac', label: 'Hypertension / Cardiovascular Condition' },
  { id: 'Asthma & Respiratory', label: 'Asthma / Chronic Respiratory Disease' },
  { id: 'Renal / Dialysis', label: 'Renal Failure / Dialysis Dependent' },
  { id: 'Epilepsy & Neurological', label: 'Epilepsy / Neurological Disorder' },
  { id: 'Physical Disability', label: 'Physical Disability / Wheelchair User' },
];

const VULNERABILITY_OPTIONS = [
  'None / General',
  'Infant / Child (<10 yrs)',
  'Elderly (>65 yrs)',
  'Pregnant / Lactating Mother',
  'Physical Disability / Reduced Mobility',
  'Bedridden / Critical Care',
  'Hearing / Visual Impairment',
];

interface StepMedicalFamilyProps {
  bloodGroup: string;
  onBloodGroupChange: (val: string) => void;
  longTermDiseases: string[];
  onLongTermDiseasesChange: (val: string[]) => void;
  familyMembers: FamilyMember[];
  onFamilyMembersChange: (val: FamilyMember[]) => void;
  error?: string | null;
}

export const StepMedicalFamily: React.FC<StepMedicalFamilyProps> = ({
  bloodGroup,
  onBloodGroupChange,
  longTermDiseases,
  onLongTermDiseasesChange,
  familyMembers,
  onFamilyMembersChange,
  error,
}) => {
  // Handle toggling chronic disease
  const handleToggleDisease = (diseaseId: string) => {
    if (longTermDiseases.includes(diseaseId)) {
      onLongTermDiseasesChange(longTermDiseases.filter((d) => d !== diseaseId));
    } else {
      onLongTermDiseasesChange([...longTermDiseases, diseaseId]);
    }
  };

  // Add family member row
  const handleAddFamilyMember = () => {
    onFamilyMembersChange([
      ...familyMembers,
      {
        name: '',
        age: 18,
        vulnerability_note: 'None / General',
      },
    ]);
  };

  // Update specific family member
  const handleUpdateFamilyMember = (index: number, field: keyof FamilyMember, val: any) => {
    const updated = [...familyMembers];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onFamilyMembersChange(updated);
  };

  // Remove family member row
  const handleRemoveFamilyMember = (index: number) => {
    const updated = familyMembers.filter((_, i) => i !== index);
    onFamilyMembersChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Guidance Note */}
      <div className="bg-blue-50 border-l-4 border-[#0B3D6E] p-3.5 rounded-r-sm text-xs text-blue-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#0B3D6E] flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-gray-900">Medical Triage & Family Preparedness</div>
          <div className="text-gray-700 mt-0.5">
            Your chronic conditions drive which specialized emergency protocols (e.g. insulin storage during flood, asthma triggers, dialysis helplines) are automatically downloaded to this device for offline survival.
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 p-3 rounded-sm text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Blood Group & Chronic Conditions */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <HeartPulse className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase">
            3.1 Medical Profile / रक्त समूह व स्वास्थ्य स्थिति <span className="text-red-600">*</span>
          </h3>
        </div>

        {/* Blood Group Select */}
        <div className="max-w-xs">
          <label htmlFor="reg-blood-group" className="block text-xs font-semibold text-gray-800 mb-1">
            Blood Group / रक्त समूह <span className="text-red-600">*</span>
          </label>
          <select
            id="reg-blood-group"
            value={bloodGroup}
            onChange={(e) => onBloodGroupChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-gray-300 focus:border-[#0B3D6E] rounded-sm text-gray-900 bg-white font-semibold"
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        {/* Chronic Conditions Checklist */}
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#0B3D6E]" />
            <span>Long-Term Chronic Conditions / दीर्घावधि रोग (Select all that apply):</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {CHRONIC_DISEASES.map((dis) => {
              const isChecked = longTermDiseases.includes(dis.id);
              return (
                <label
                  key={dis.id}
                  className={`flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer select-none text-xs transition-colors ${
                    isChecked
                      ? 'bg-red-50/70 border-red-400 text-red-950 font-semibold'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleDisease(dis.id)}
                    className="w-4 h-4 mt-0.5 text-red-600 rounded-sm focus:ring-red-500"
                  />
                  <span>{dis.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: Family Roster */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B3D6E]" />
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              3.2 Family & Dependents Roster / परिवार के सदस्य (Total: {familyMembers.length + 1} PAX)
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddFamilyMember}
            className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-blue-900 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Family Member</span>
          </button>
        </div>

        <p className="text-xs text-gray-600">
          Adding family members ensures the SOS form automatically pre-computes rescue passenger count (PAX) and flags critical vulnerabilities like infants and elderly.
        </p>

        {familyMembers.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-sm p-4 text-center text-xs text-gray-500">
            No additional family members added. Tap <span className="font-semibold text-[#0B3D6E]">"+ Add Family Member"</span> above to include dependents living with you.
          </div>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-300 p-3 sm:p-4 rounded-sm space-y-3 relative"
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-800 border-b border-gray-200 pb-1.5">
                  <span>Dependent #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFamilyMember(index)}
                    aria-label={`Remove dependent ${index + 1}`}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Member Name */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Full Name / नाम <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={member.name}
                      onChange={(e) => handleUpdateFamilyMember(index, 'name', e.target.value)}
                      placeholder="e.g. Suman Sharma"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 focus:border-[#0B3D6E] rounded-sm bg-white text-gray-900"
                    />
                  </div>

                  {/* Member Age */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Age / आयु <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      required
                      value={member.age}
                      onChange={(e) => handleUpdateFamilyMember(index, 'age', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 focus:border-[#0B3D6E] rounded-sm bg-white text-gray-900 font-mono"
                    />
                  </div>

                  {/* Vulnerability Note */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Vulnerability / विशेष स्थिति
                    </label>
                    <select
                      value={member.vulnerability_note || 'None / General'}
                      onChange={(e) => handleUpdateFamilyMember(index, 'vulnerability_note', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:border-[#0B3D6E] rounded-sm bg-white text-gray-900"
                    >
                      {VULNERABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
