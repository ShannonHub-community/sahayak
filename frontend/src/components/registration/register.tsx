import React, { useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { RegistrationWizard } from '@/components/registration/RegistrationWizard';
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <Head>
        <title>Citizen Pre-Registration | Sahayak Emergency Response Portal</title>
        <meta
          name="description"
          content="Pre-register your household demographics, medical conditions, and home location to enable offline survival guides and automatic emergency SOS routing."
        />
      </Head>

      {/* Official Government Header */}
      <GovHeader onSkipToContent={() => mainContentRef.current?.focus()} />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-gray-300 py-2 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-gray-600">
          <Link href="/" className="hover:text-[#0B3D6E] flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Emergency SOS (Home)</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900">Citizen Pre-Registration</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col outline-none"
      >
        <RegistrationWizard />
      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
}
