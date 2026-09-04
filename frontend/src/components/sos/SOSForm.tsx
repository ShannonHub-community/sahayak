import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  HeartPulse, 
  Baby, 
  Accessibility, 
  Send, 
  X, 
  UserCheck, 
  FileText, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { MiniMapProps } from './MiniMap';
import { getRealCoordinates } from '@/services/geolocation';

const MiniMap = dynamic<MiniMapProps>(

  () => import('./MiniMap').then((mod) => mod.MiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-slate-200 border-2 border-gray-300 rounded-sm flex items-center justify-center text-xs text-gray-600">
        Loading Incident Map...
      </div>
    ),
  }
);
import type { SOSLocation, SOSPayload, SOSResponse, CitizenProfile } from '@/types/sos';
import { getBrowserIdentifier, getBrowserSessionId } from '@/services/browserIdentifier';
import { lookupCitizenProfile } from '@/services/autofill';
import { getCachedGuide } from '@/services/offlineCache';
import type { FirstAidGuideContent } from '@/services/offlineCache';
import { submitSOS } from '@/services/sos';


interface SOSFormProps {
  onCancel?: () => void;
  onSubmitSuccess: (response: SOSResponse) => void;
}



const CRITICAL_MEDICAL_CONDITIONS = [
  { value: '', label: 'None / कोई नहीं' },
  { value: 'Mobility Issues', label: 'Mobility Issues / गतिशीलता समस्या' },
  { value: 'Diabetic / Insulin Dependent', label: 'Diabetic / Insulin Dependent / मधुमेह (इंसुलिन)' },
  { value: 'Requires Oxygen / Ventilator', label: 'Requires Oxygen / Ventilator / ऑक्सीजन / वेंटिलेटर आवश्यक' },
  { value: 'Pregnancy', label: 'Pregnancy / गर्भावस्था' },
  { value: 'Other', label: 'Other / अन्य' },
];

export const SOSForm: React.FC<SOSFormProps> = ({ onCancel, onSubmitSuccess }) => {
  // Citizen Identity & Recognition
  const [browserId, setBrowserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isRecognizedProfileConfirmed, setIsRecognizedProfileConfirmed] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [paxCount, setPaxCount] = useState<number>(1);
  const [medicalEmergency, setMedicalEmergency] = useState<boolean>(false);
  const [medicalCondition, setMedicalCondition] = useState<string>('');
  const [includesInfants, setIncludesInfants] = useState<boolean>(false);
  const [includesElderly, setIncludesElderly] = useState<boolean>(false);
  const [landmark, setLandmark] = useState<string>('');

  // Location State
  const [currentLocation, setCurrentLocation] = useState<SOSLocation | null>(null);
  const [isAcquiringLocation, setIsAcquiringLocation] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // First Aid Offline Guide State
  const [cachedGuide, setCachedGuide] = useState<FirstAidGuideContent | null>(null);
  const [showGuideNotice, setShowGuideNotice] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Initial Device Recognition check on mount
  useEffect(() => {
    // Safety-net: forcefully release the loading guard after 5 s, regardless of
    // backend availability. Prevents permanent UI blockage on slow/offline starts.
    const timeoutId = setTimeout(() => {
      setIsLoadingProfile((prev) => {
        if (prev) {
          console.warn('[SOSForm] Profile lookup timed out after 5 s — continuing without autofill.');
        }
        return false;
      });
    }, 5000);

    async function checkRecognition() {
      setIsLoadingProfile(true);
      const id = getBrowserIdentifier();
      setBrowserId(id);

      if (id) {
        try {
          const foundProfile = await lookupCitizenProfile(id);
          if (foundProfile) {
            setProfile(foundProfile);
          }
        } catch (err) {
          console.warn('[SOSForm] Profile lookup failed — falling back to manual entry.', err);
        }
      }

      clearTimeout(timeoutId);
      setIsLoadingProfile(false);
    }

    checkRecognition();

    return () => clearTimeout(timeoutId);
  }, []);

  // 2. Geolocation acquisition
  const acquireGPS = async () => {
    if (typeof window === 'undefined') return;

    setIsAcquiringLocation(true);
    setLocationError(null);

    try {
      const coords = await getRealCoordinates();
      setIsAcquiringLocation(false);
      const newLocation: SOSLocation = {
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        isFallback: false,
      };
      setCurrentLocation(newLocation);
      setLocationError(null);
    } catch (err: any) {
      setIsAcquiringLocation(false);
      setCurrentLocation(null);
      setLocationError(err?.message || 'Unable to acquire GPS location.');
    }
  };

  useEffect(() => {
    acquireGPS();
  }, []);

  // 3. First Aid cached guide trigger on Medical Emergency checkbox
  useEffect(() => {
    if (medicalEmergency) {
      getCachedGuide('first-aid').then((guide) => {
        if (guide) {
          setCachedGuide(guide);
          setShowGuideNotice(false);
        } else {
          setCachedGuide(null);
          setShowGuideNotice(true);
        }
      });
    } else {
      setShowGuideNotice(false);
    }
  }, [medicalEmergency]);

  // Handle Confirmed Profile Pre-fill
  const handleConfirmProfile = () => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || '');
      
      if (profile.family_members_count && profile.family_members_count > 0) {
        setPaxCount(profile.family_members_count);
      } else if (profile.family_members && profile.family_members.length > 0) {
        setPaxCount(profile.family_members.length + 1);
      }

      if (profile.medical_conditions || (profile.long_term_diseases && profile.long_term_diseases.length > 0)) {
        setMedicalEmergency(true);
        const conditionsStr = profile.medical_conditions || (profile.long_term_diseases ? profile.long_term_diseases.join(' ') : '');
        const lower = conditionsStr.toLowerCase();
        if (lower.includes('mobility') || lower.includes('wheelchair')) {
          setMedicalCondition('Mobility Issues');
        } else if (lower.includes('diabet') || lower.includes('insulin')) {
          setMedicalCondition('Diabetic / Insulin Dependent');
        } else if (lower.includes('oxygen') || lower.includes('ventilator') || lower.includes('asthma') || lower.includes('respiratory')) {
          setMedicalCondition('Requires Oxygen / Ventilator');
        } else if (lower.includes('pregnan')) {
          setMedicalCondition('Pregnancy');
        } else if (conditionsStr.trim()) {
          setMedicalCondition('Other');
        }
      }

      if (profile.age && profile.age >= 60) {
        setIncludesElderly(true);
      }

      if (profile.family_members && profile.family_members.length > 0) {
        const hasInfant = profile.family_members.some(
          (m) => (m.age !== undefined && m.age <= 10) || 
                 (m.vulnerability_note && /infant|child|baby/i.test(m.vulnerability_note))
        );
        const hasElderly = profile.family_members.some(
          (m) => (m.age !== undefined && m.age >= 60) || 
                 (m.vulnerability_note && /elderly|senior|aged/i.test(m.vulnerability_note))
        );
        if (hasInfant) setIncludesInfants(true);
        if (hasElderly) setIncludesElderly(true);
      }

      setIsRecognizedProfileConfirmed(true);
    }
  };


  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter your name or an identifier (e.g. Family / Caller Name).');
      return;
    }

    if (!currentLocation) {
      setFormError('Real GPS coordinates are required for emergency dispatch. Please tap "Use Current Location" to acquire your position.');
      return;
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const payload: SOSPayload = {
      citizen_id: profile?.citizen_id ?? null,
      name: trimmedName,
      phone: phone.trim() ? phone.trim() : null,
      pax_count: paxCount,
      medical_emergency: medicalEmergency || Boolean(medicalCondition),
      medical_condition: medicalCondition.trim() ? medicalCondition.trim() : null,
      includes_infants: includesInfants,
      includes_elderly: includesElderly,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      },
      landmark: landmark.trim() ? landmark.trim() : null,
      transmission_method: isOnline ? 'internet' : 'sms',
      browser_session_id: getBrowserSessionId(),
    };

    setIsSubmitting(true);
    try {
      const response = await submitSOS(payload);
      onSubmitSuccess(response);
    } catch (err: any) {
      console.error('SOS submission failed:', err);
      setFormError(err.message || 'Failed to transmit SOS. Please call 112 directly or try SMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white border-2 border-[#D32F2F] rounded-sm shadow-lg overflow-hidden">
      {/* Form Header Banner */}
      <div className="bg-[#D32F2F] text-white p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase leading-tight">
              EMERGENCY SOS DISPATCH / आपातकालीन सहायता
            </h2>
            <p className="text-xs text-red-100">
              Immediate Relay to NDRF, SDRF & District Emergency Operation Centers
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-white hover:bg-red-800 p-1.5 rounded-sm transition-colors"
            title="Cancel and return to home"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Form Error Banner */}
        {formError && (
          <div className="bg-red-50 border-2 border-red-600 p-3 rounded-sm text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transmission Error: </span>
              {formError}
            </div>
          </div>
        )}

        {/* 1. Recognition / Manual Entry Section */}
        {profile && !isRecognizedProfileConfirmed ? (
          <div className="bg-blue-50 border border-blue-300 p-3 rounded-sm text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0B3D6E] flex-shrink-0" />
              <div>
                <div className="font-bold">Welcome back, resume as {profile.name}?</div>
                <div className="text-[11px] text-gray-700">
                  Pre-fills saved emergency contacts and family medical info.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleConfirmProfile}
                className="flex-1 sm:flex-none bg-[#0B3D6E] text-white px-3 py-1.5 rounded-sm font-semibold text-xs hover:bg-[#07284B]"
              >
                Yes, Resume
              </button>
              <button
                type="button"
                onClick={() => setIsRecognizedProfileConfirmed(true)}
                className="flex-1 sm:flex-none bg-gray-200 text-gray-800 px-3 py-1.5 rounded-sm font-semibold text-xs hover:bg-gray-300"
              >
                Enter Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sos-name" className="block text-xs font-bold text-gray-800 mb-1">
                FULL NAME / पूरा नाम <span className="text-red-600">*</span>
              </label>
              <input
                id="sos-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar / Sharma Family"
                className="w-full border-2 border-gray-400 focus:border-[#0B3D6E] px-3 py-2.5 text-sm rounded-sm text-gray-900 bg-white"
              />
            </div>

            <div>
              <label htmlFor="sos-phone" className="block text-xs font-bold text-gray-800 mb-1">
                CONTACT PHONE / फ़ोन नंबर (Optional)
              </label>
              <input
                id="sos-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full border-2 border-gray-400 focus:border-[#0B3D6E] px-3 py-2.5 text-sm rounded-sm text-gray-900 bg-white"
              />
            </div>
          </div>
        )}

        {/* 2. PAX Stepper + Emergency Checkboxes */}
        <div className="border border-gray-300 bg-gray-50 p-3 sm:p-4 rounded-sm space-y-4">
          {/* PAX Counter & Typed Input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0B3D6E]" />
                <span>NUMBER OF PERSONS NEEDING RESCUE (PAX) / कुल व्यक्ति</span>
              </div>
              <p className="text-[11px] text-gray-600">Include all trapped or stranded individuals</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Stepper Buttons */}
              <div className="flex items-center border-2 border-[#0B3D6E] bg-white rounded-sm">
                <button
                  type="button"
                  onClick={() => setPaxCount((prev) => Math.max(1, prev - 1))}
                  aria-label="Decrease passenger count"
                  className="w-11 h-11 flex items-center justify-center text-lg font-bold text-[#0B3D6E] hover:bg-gray-100 active:bg-gray-200"
                >
                  -
                </button>
                <span className="w-12 text-center text-lg font-bold text-gray-900 font-mono select-none">
                  {paxCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPaxCount((prev) => prev + 1)}
                  aria-label="Increase passenger count"
                  className="w-11 h-11 flex items-center justify-center text-lg font-bold text-[#0B3D6E] hover:bg-gray-100 active:bg-gray-200"
                >
                  +
                </button>
              </div>

              {/* Direct Numeric Typed Input */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="pax-typed-input" className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">
                  Or Type:
                </label>
                <input
                  id="pax-typed-input"
                  type="number"
                  min={1}
                  step={1}
                  value={paxCount}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed >= 1) {
                      setPaxCount(parsed);
                    } else if (e.target.value === '') {
                      setPaxCount(1);
                    }
                  }}
                  onBlur={() => {
                    if (paxCount < 1 || isNaN(paxCount)) {
                      setPaxCount(1);
                    }
                  }}
                  className="w-20 h-11 px-2.5 text-center font-mono font-bold text-base text-gray-900 border-2 border-gray-400 focus:border-[#0B3D6E] rounded-sm bg-white"
                  aria-label="Direct type number of persons needing rescue"
                />
              </div>
            </div>
          </div>


          <hr className="border-gray-200" />

          {/* Vulnerability Checkboxes */}
          <div>
            <div className="text-xs font-bold text-gray-900 mb-2">
              CRITICAL EMERGENCY TAGS / विशेष प्राथमिकता:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Medical Emergency */}
              <label
                className={`flex items-center gap-2.5 p-2.5 border rounded-sm cursor-pointer select-none transition-colors ${
                  medicalEmergency
                    ? 'bg-red-50 border-red-600 text-red-950 font-bold'
                    : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={medicalEmergency}
                  onChange={(e) => setMedicalEmergency(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded-sm focus:ring-red-500"
                />
                <HeartPulse className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-xs">Medical Emergency / चिकित्सा</span>
              </label>

              {/* Includes Infants */}
              <label
                className={`flex items-center gap-2.5 p-2.5 border rounded-sm cursor-pointer select-none transition-colors ${
                  includesInfants
                    ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold'
                    : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includesInfants}
                  onChange={(e) => setIncludesInfants(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                />
                <Baby className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs">Includes Infants / शिशु</span>
              </label>

              {/* Includes Elderly */}
              <label
                className={`flex items-center gap-2.5 p-2.5 border rounded-sm cursor-pointer select-none transition-colors ${
                  includesElderly
                    ? 'bg-purple-50 border-purple-600 text-purple-950 font-bold'
                    : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includesElderly}
                  onChange={(e) => setIncludesElderly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500"
                />
                <Accessibility className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-xs">Includes Elderly / वरिष्ठ</span>
              </label>
            </div>

            {/* Critical Medical Needs Dropdown */}
            <div className="mt-3">
              <label htmlFor="sos-medical-condition" className="block text-xs font-bold text-gray-900 mb-1">
                Critical Medical Needs (Optional) / विशिष्ट चिकित्सीय आवश्यकता:
              </label>
              <select
                id="sos-medical-condition"
                value={medicalCondition}
                onChange={(e) => {
                  const val = e.target.value;
                  setMedicalCondition(val);
                  if (val) {
                    setMedicalEmergency(true);
                  }
                }}
                className="w-full h-10 px-3 text-xs text-slate-900 border-2 border-gray-400 focus:border-[#0B3D6E] rounded-sm bg-white cursor-pointer font-medium"
              >
                {CRITICAL_MEDICAL_CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* First Aid Cached Guide inline preview or graceful fallback */}
          {medicalEmergency && (
            <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-600 rounded-r-sm text-xs text-red-900">
              {cachedGuide ? (
                <div>
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <FileText className="w-4 h-4 text-red-700" />
                    <span>OFFLINE FIRST AID PROTOCOL: {cachedGuide.title}</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {cachedGuide.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              ) : showGuideNotice ? (
                <div className="flex items-center gap-1.5 text-gray-700 text-[11px]">
                  <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    First-aid offline guides will be downloaded and available once registered. Keep patient immobilized in safe area.
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 3. Location: MiniMap in mode="live" + Landmark */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-900">
              INCIDENT LOCATION / घटना स्थल (Live GPS) <span className="text-red-600">*</span>
            </label>
            {locationError && (
              <span className="text-[11px] text-amber-800 font-medium">
                {locationError}
              </span>
            )}
          </div>

          <MiniMap
            mode="live"
            location={currentLocation}
            onLocationChange={(loc: SOSLocation) => setCurrentLocation(loc)}
            onRefreshLocation={acquireGPS}
            isLoadingLocation={isAcquiringLocation}
            locationError={locationError}
            className="mb-2"
          />

          <div className="mt-2">
            <label htmlFor="sos-landmark" className="block text-xs font-bold text-gray-800 mb-1">
              LANDMARK / पहचान चिन्ह (Optional — e.g. "Near red water tank, 2nd floor balcony")
            </label>
            <input
              id="sos-landmark"
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Old Temple, Roof of yellow 2-story building"
              maxLength={150}
              className="w-full border border-gray-400 focus:border-[#0B3D6E] px-3 py-2 text-xs rounded-sm text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* 4. Dual-Transmission Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] text-white font-bold text-base sm:text-lg rounded-sm py-3 px-6 border-2 border-red-800 shadow-md flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <span>TRANSMITTING EMERGENCY SOS... / सूचना भेजी जा रही है...</span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>TRANSMIT SOS TO RESCUE DISPATCH / आपातकालीन सहायता भेजें</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-gray-500 mt-2">
            Online reports are relayed directly to the Central Emergency Grid. If disconnected, your native SMS application will open pre-configured for dispatch 112.
          </p>
        </div>
      </form>
    </div>
  );
};
