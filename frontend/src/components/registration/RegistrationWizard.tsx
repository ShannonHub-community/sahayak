import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  HeartPulse, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { StepIdentity } from './StepIdentity';
import { StepBasicProfile } from './StepBasicProfile';
import { StepMedicalFamily } from './StepMedicalFamily';
import { StepConfirmation } from './StepConfirmation';
import type { 
  CitizenRegistrationPayload, 
  FamilyMember, 
  CitizenLocation, 
  RegistrationResponse 
} from '@/types/registration';
import { submitRegistration } from '@/services/registration';
import { getRealCoordinates } from '@/services/geolocation';

const STEPS = [
  { id: 1, title: 'Identity Verification', sub: 'Phone & Aadhaar' },
  { id: 2, title: 'Basic Profile', sub: 'Demographics & Location' },
  { id: 3, title: 'Medical & Family', sub: 'Triage & Dependents' },
];



export const RegistrationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [registrationResponse, setRegistrationResponse] = useState<RegistrationResponse | null>(null);

  // Form State
  // Step 1
  const [phone, setPhone] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [aadhaar, setAadhaar] = useState<string>('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState<boolean>(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);

  // Step 2
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<string>('Male');
  const [homeLocation, setHomeLocation] = useState<CitizenLocation | null>(null);
  const [workLocation, setWorkLocation] = useState<CitizenLocation | null>(null);

  // Auto-acquire background real location on mount
  React.useEffect(() => {
    getRealCoordinates()
      .then((coords) => {
        setHomeLocation({ lat: coords.lat, lng: coords.lng });
      })
      .catch((err) => {
        // User can manually pin in Step 2 or click "Use Current Location"
        console.info('Auto-detect skipped for registration:', err?.message);
      });
  }, []);

  // Step 3
  const [bloodGroup, setBloodGroup] = useState<string>('B+');
  const [longTermDiseases, setLongTermDiseases] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Handle Aadhaar Mock Profile Fetch
  const handleAadhaarProfileFetched = (profile: { name: string; age: number; gender: string }) => {
    setName(profile.name);
    setAge(profile.age);
    setGender(profile.gender);
    setIsAadhaarVerified(true);
    setStepError(null);
  };

  // Validation before proceeding
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10 && !isAadhaarVerified) {
        setStepError('Please enter a valid 10-digit mobile number or verify Aadhaar.');
        return;
      }
      if (!isPhoneVerified && !isAadhaarVerified) {
        setStepError('Please verify your mobile number with the OTP or verify Aadhaar before continuing.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      if (!name.trim()) {
        setStepError('Please enter your full legal name.');
        return;
      }
      const numAge = typeof age === 'number' ? age : parseInt(String(age), 10);
      if (isNaN(numAge) || numAge <= 0 || numAge > 120) {
        setStepError('Please enter a valid age between 1 and 120.');
        return;
      }
      if (!gender) {
        setStepError('Please select your gender.');
        return;
      }
      if (!homeLocation) {
        setStepError('Please allow location access or tap the map to pin your home location.');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    // Validation for Step 3
    if (!homeLocation) {
      setStepError('Please set your home location before completing registration.');
      return;
    }

    if (!bloodGroup) {
      setStepError('Please select your blood group.');
      return;
    }

    for (let i = 0; i < familyMembers.length; i++) {
      if (!familyMembers[i].name.trim()) {
        setStepError(`Please enter a name for Family Member #${i + 1}.`);
        return;
      }
    }

    const payload: CitizenRegistrationPayload = {
      phone: phone.replace(/\D/g, ''),
      name: name.trim(),
      age: typeof age === 'number' ? age : 30,
      gender,
      home_location: homeLocation,
      work_location: workLocation,
      blood_group: bloodGroup,
      long_term_diseases: longTermDiseases,
      bluetooth_enabled: bluetoothEnabled,
      family_members: familyMembers,
    };

    setIsSubmitting(true);
    try {
      const res = await submitRegistration(payload);
      setRegistrationResponse(res);
      setCurrentStep(4); // Confirmation step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setStepError(err.message || 'Registration failed. Please check your network and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Submit Wrapper (guards Steps 1 & 2 from premature submission on Enter key)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 3) {
      handleFinalSubmit(e);
    } else {
      handleNextStep();
    }
  };

  // Build full payload for summary in confirmation step
  const finalPayload: CitizenRegistrationPayload = {
    phone: phone.replace(/\D/g, ''),
    name: name.trim(),
    age: typeof age === 'number' ? age : 30,
    gender,
    home_location: homeLocation || { lat: 0, lng: 0 },
    work_location: workLocation,
    blood_group: bloodGroup,
    long_term_diseases: longTermDiseases,
    bluetooth_enabled: bluetoothEnabled,
    family_members: familyMembers,
  };

  return (
    <div className="w-full bg-white border border-gray-300 rounded-sm shadow-md overflow-hidden">
      {/* Wizard Header Banner — Calm Government Navy */}
      <div className="bg-[#0B3D6E] text-white p-4 sm:p-5 border-b border-blue-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#FF9933] text-black font-bold uppercase px-2 py-0.5 rounded-sm">
                PEACETIME CITIZEN REGISTRY
              </span>
              <span className="text-xs text-blue-200">NDMA / State Disaster Management</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-white mt-1">
              National Citizen Emergency Registration / नागरिक पंजीकरण
            </h1>
          </div>

          <div className="text-right text-xs text-blue-200">
            {currentStep <= 3 ? `Step ${currentStep} of 3` : 'Completed'}
          </div>
        </div>

        {/* Step Indicator Tabs (Interactive) */}
        {currentStep <= 3 && (
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-blue-800">
            {STEPS.map((step) => {
              const isCurrent = currentStep === step.id;
              const isDone = currentStep > step.id;

              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => {
                    setStepError(null);
                    setCurrentStep(step.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-2 rounded-sm border transition-colors flex items-center gap-2 text-left cursor-pointer ${
                    isCurrent
                      ? 'bg-white text-[#0B3D6E] border-white font-bold shadow-sm'
                      : isDone
                      ? 'bg-blue-900/60 text-blue-100 border-blue-700 hover:bg-blue-800/80'
                      : 'bg-blue-950/40 text-blue-300 border-blue-900/60 hover:bg-blue-900/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      isCurrent
                        ? 'bg-[#0B3D6E] text-white'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-800 text-blue-200'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <div className="hidden sm:block truncate">
                    <div className="text-[11px] leading-tight truncate">{step.title}</div>
                    <div className="text-[10px] opacity-80 leading-tight truncate">{step.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Wizard Step Content Form */}
      <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-6">
        {stepError && (
          <div className="bg-red-50 border-2 border-red-600 p-3 rounded-sm text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Attention: </span>
              {stepError}
            </div>
          </div>
        )}

        {/* STEP 1: Identity */}
        {currentStep === 1 && (
          <StepIdentity
            phone={phone}
            onPhoneChange={setPhone}
            isPhoneVerified={isPhoneVerified}
            onPhoneVerifiedChange={setIsPhoneVerified}
            aadhaar={aadhaar}
            onAadhaarChange={setAadhaar}
            isAadhaarVerified={isAadhaarVerified}
            onAadhaarVerifiedChange={setIsAadhaarVerified}
            bluetoothEnabled={bluetoothEnabled}
            onBluetoothEnabledChange={setBluetoothEnabled}
            onProfileFetched={handleAadhaarProfileFetched}
          />
        )}

        {/* STEP 2: Basic Profile */}
        {currentStep === 2 && (
          <StepBasicProfile
            name={name}
            onNameChange={setName}
            age={age}
            onAgeChange={setAge}
            gender={gender}
            onGenderChange={setGender}
            homeLocation={homeLocation}
            onHomeLocationChange={(loc) => {
              setHomeLocation(loc);
            }}
            workLocation={workLocation}
            onWorkLocationChange={setWorkLocation}
          />
        )}

        {/* STEP 3: Medical & Family */}
        {currentStep === 3 && (
          <StepMedicalFamily
            bloodGroup={bloodGroup}
            onBloodGroupChange={setBloodGroup}
            longTermDiseases={longTermDiseases}
            onLongTermDiseasesChange={setLongTermDiseases}
            familyMembers={familyMembers}
            onFamilyMembersChange={setFamilyMembers}
          />
        )}

        {/* STEP 4: Confirmation Screen */}
        {currentStep === 4 && registrationResponse && (
          <StepConfirmation
            response={registrationResponse}
            payload={finalPayload}
          />
        )}

        {/* Wizard Footer Controls */}
        {currentStep <= 3 && (
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-sm border border-gray-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <span className="text-[11px] text-gray-500">
                  Registration is completely optional and helps offline rescue readiness.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-bold px-5 py-2.5 rounded-sm border border-blue-900 shadow transition-colors flex items-center gap-1.5"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-sm border border-blue-900 shadow-md transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Saving Profile & Provisioning Offline Guides...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#FF9933]" />
                      <span>Complete Registration & Download Guides</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export const RegistrationForm = RegistrationWizard;
