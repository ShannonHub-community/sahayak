import React, { useState } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { DonorRegistrationModal } from './DonorRegistrationModal';
import { HumanResourcesForm } from './HumanResourcesForm';
import { MedicalSuppliesForm } from './MedicalSuppliesForm';
import { FoodMealsForm } from './FoodMealsForm';
import { FinancialAssistanceForm } from './FinancialAssistanceForm';
import { FundsTrackerWidget } from './FundsTrackerWidget';
import { Users, Stethoscope, Utensils, DollarSign, ShieldCheck, UserCheck, Sparkles, CheckCircle2, ArrowRight, HeartHandshake } from 'lucide-react';

export const DonationPortalTab = () => {
  const { addIncomingRequest, setActiveTab } = useLedger();

  // Active Category State
  const [activeCategory, setActiveCategory] = useState('Human Resources'); // 'Human Resources' | 'Medical Equipment' | 'Food & Meals' | 'Financial Assistance'
  
  // Registered Donor State
  const [currentDonor, setCurrentDonor] = useState({
    id: 'DONOR-INIT-101',
    type: 'individual',
    name: 'Ananya Sharma',
    contact: '+91 98765 43210',
    age: 28,
    gender: 'Female',
    blood_group: 'O+',
    medical_conditions: 'None',
    verification_ref: '9876-5432-1098',
    verification_status: 'verified',
    badge: 'Verified Individual (Aadhaar: 9876-5432-1098)'
  });

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [lastSubmissionSuccess, setLastSubmissionSuccess] = useState(null);

  const handleCategorySubmitSuccess = (submissionPayload) => {
    // If submission is non-financial (HR, Medical, Food), transmit into donations pipeline (LedgerContext requests)
    if (submissionPayload.category !== 'Financial Assistance') {
      addIncomingRequest({
        donor: submissionPayload.donor_name || currentDonor.name,
        donorType: currentDonor.type === 'individual' ? 'Individual' : 'Organization',
        type: submissionPayload.category === 'Human Resources' ? 'Personnel' : 'Supplies',
        resource: submissionPayload.resource_name || (submissionPayload.category === 'Human Resources' ? `HR (${submissionPayload.skill_category})` : 'Relief Rations'),
        quantity: `${submissionPayload.numeric_quantity || submissionPayload.quantity || 1} units`,
        numericQuantity: submissionPayload.numeric_quantity || 100,
        location: submissionPayload.location || 'Sector 4',
        contactPerson: submissionPayload.donor_name || currentDonor.name,
        phone: submissionPayload.phone || currentDonor.contact,
        notes: submissionPayload.notes || 'Submitted via Citizen Donation Portal'
      });
    }

    setLastSubmissionSuccess(submissionPayload);

    // Scroll to top of section cleanly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1700px] mx-auto p-4 space-y-6">
      
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              <span>FEAT-25 • SAHAYAK Citizen Donation Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Citizen & Organization Help Gateway
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
              Register once with strict identity verification, then submit offers across 4 category rules (HR Volunteer availability, 3-month medical expiry checks, FSSAI cooked-food timestamps, and CMRF financial routing).
            </p>
          </div>

          {/* Donor Profile Quick Bar */}
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-2 shrink-0 w-full sm:w-auto">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Active Registered Profile:</span>
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">{currentDonor.name}</span>
              <span className="text-[11px] text-emerald-300 font-mono font-bold block">{currentDonor.badge}</span>
            </div>
            <button
              onClick={() => setIsRegistrationModalOpen(true)}
              className="w-full mt-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
            >
              Edit Profile / Switch Org
            </button>
          </div>
        </div>
      </div>

      {/* Submission Success Alert */}
      {lastSubmissionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <h4 className="font-bold text-sm">
              {lastSubmissionSuccess.category} Contribution Transmitted to Donation Coordinator!
            </h4>
          </div>
          <p className="text-xs text-slate-700">
            {lastSubmissionSuccess.category === 'Financial Assistance'
              ? `Your contribution of ₹${lastSubmissionSuccess.amount.toLocaleString('en-IN')} has routed to ${lastSubmissionSuccess.target_account}. Section 80G Tax Exemption Certificate issued!`
              : `Your ${lastSubmissionSuccess.category} offer has been validated and queued in the EOC Incoming Help pipeline for Coordinator review and shelter routing.`
            }
          </p>
          <div className="pt-1 flex items-center space-x-3">
            {lastSubmissionSuccess.category !== 'Financial Assistance' && (
              <button
                onClick={() => setActiveTab('eoc-ledger')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow cursor-pointer flex items-center space-x-1"
              >
                <span>View in EOC Incoming Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setLastSubmissionSuccess(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* SITE-WIDE PUBLIC FUNDS TRACKER WIDGET */}
      <FundsTrackerWidget />

      {/* 4 CATEGORY SELECTION CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            Select Help Category
            <span className="text-xs font-semibold text-slate-500 font-normal">
              (Category-coded built-in validation rules active)
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: HUMAN RESOURCES (BLUE) */}
          <button
            type="button"
            onClick={() => setActiveCategory('Human Resources')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              activeCategory === 'Human Resources'
                ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500/30'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                Blue Accent
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Human Resources</h3>
              <p className="text-xs text-slate-500 leading-snug mt-1">
                Volunteer photo, Aadhaar, medical conditions & availability windows mapping onto fixed skill taxonomy.
              </p>
            </div>
          </button>

          {/* CARD 2: MEDICAL SUPPLIES (GREEN) */}
          <button
            type="button"
            onClick={() => setActiveCategory('Medical Equipment')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              activeCategory === 'Medical Equipment'
                ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/30'
                : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Green Accent
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Medical Supplies</h3>
              <p className="text-xs text-slate-500 leading-snug mt-1">
                Auto-rejects medication expiring within 3 months (&lt; 90 days) to prevent unsafe drug dumping.
              </p>
            </div>
          </button>

          {/* CARD 3: FOOD & MEALS (ORANGE) */}
          <button
            type="button"
            onClick={() => setActiveCategory('Food & Meals')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              activeCategory === 'Food & Meals'
                ? 'border-amber-600 bg-amber-50/90 shadow-md ring-2 ring-amber-500/30'
                : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                Orange Accent
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Food & Meals</h3>
              <p className="text-xs text-slate-500 leading-snug mt-1">
                Prep timestamp check against FSSAI 4–6hr window for cooked meals. Dry rations encouraged.
              </p>
            </div>
          </button>

          {/* CARD 4: FINANCIAL ASSISTANCE (PURPLE) */}
          <button
            type="button"
            onClick={() => setActiveCategory('Financial Assistance')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              activeCategory === 'Financial Assistance'
                ? 'border-purple-600 bg-purple-50/90 shadow-md ring-2 ring-purple-500/30'
                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                Purple Accent
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Financial Assistance</h3>
              <p className="text-xs text-slate-500 leading-snug mt-1">
                Direct CMRF/NDMA account routing with PAN & instant Section 80G tax exemption certificates.
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* ACTIVE FORM RENDERER */}
      <div className="pt-2">
        {activeCategory === 'Human Resources' && (
          <HumanResourcesForm
            currentDonor={currentDonor}
            onSubmitSuccess={handleCategorySubmitSuccess}
          />
        )}

        {activeCategory === 'Medical Equipment' && (
          <MedicalSuppliesForm
            currentDonor={currentDonor}
            onSubmitSuccess={handleCategorySubmitSuccess}
          />
        )}

        {activeCategory === 'Food & Meals' && (
          <FoodMealsForm
            currentDonor={currentDonor}
            onSubmitSuccess={handleCategorySubmitSuccess}
          />
        )}

        {activeCategory === 'Financial Assistance' && (
          <FinancialAssistanceForm
            currentDonor={currentDonor}
            onSubmitSuccess={handleCategorySubmitSuccess}
          />
        )}
      </div>

      {/* DONOR REGISTRATION MODAL */}
      <DonorRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        currentDonor={currentDonor}
        onRegisterSuccess={(newDonor) => {
          setCurrentDonor(newDonor);
        }}
      />

    </div>
  );
};
