import React, { useState } from 'react';
import { 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Info
} from 'lucide-react';
import { sendOtp, verifyOtp } from '@/services/otp';

interface StepIdentityProps {
  phone: string;
  onPhoneChange: (val: string) => void;
  isPhoneVerified: boolean;
  onPhoneVerifiedChange: (val: boolean) => void;
  aadhaar: string;
  onAadhaarChange: (val: string) => void;
  isAadhaarVerified: boolean;
  onAadhaarVerifiedChange: (val: boolean) => void;
  bluetoothEnabled: boolean;
  onBluetoothEnabledChange: (val: boolean) => void;
  onProfileFetched?: (profile: { name: string; age: number; gender: string }) => void;
  error?: string | null;
}

export const MOCK_AADHAAR_PROFILES = [
  { name: 'Ganesh Kakaso Gorad', age: 19, gender: 'Male' },
  { name: 'Amruta Sameer Dhepe', age: 19, gender: 'Female' },
  { name: 'Vikram Singh', age: 34, gender: 'Male' },
];

export const StepIdentity: React.FC<StepIdentityProps> = ({
  phone,
  onPhoneChange,
  isPhoneVerified,
  onPhoneVerifiedChange,
  aadhaar,
  onAadhaarChange,
  isAadhaarVerified,
  onAadhaarVerifiedChange,
  bluetoothEnabled,
  onBluetoothEnabledChange,
  onProfileFetched,
  error,
}) => {
  // OTP Local State
  const [otpValue, setOtpValue] = useState<string>('');
  const [txnId, setTxnId] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpSending, setOtpSending] = useState<boolean>(false);
  const [otpVerifying, setOtpVerifying] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  // Aadhaar Local State
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);

  // Bluetooth Permission Local State
  const [btStatusText, setBtStatusText] = useState<string>(
    bluetoothEnabled ? 'Enabled for offline SOS relay' : 'Optional offline mesh relay'
  );
  const [btRequesting, setBtRequesting] = useState<boolean>(false);

  // Send OTP
  const handleSendOtp = async () => {
    setOtpError(null);
    setOtpSuccessMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setOtpSending(true);
    try {
      const res = await sendOtp(cleanPhone);
      setTxnId(res.txnId);
      setOtpSent(true);
      setDemoOtpHint(res.demoOtp);
      setOtpSuccessMessage(res.message);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setOtpError(null);
    if (!otpValue || otpValue.trim().length !== 6) {
      setOtpError('Please enter 6-digit OTP');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await verifyOtp(phone, otpValue, txnId);
      if (res.success) {
        onPhoneVerifiedChange(true);
        setOtpSuccessMessage('Mobile number verified successfully');
        setOtpError(null);
      } else {
        setOtpError(res.message || 'Incorrect OTP code');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Mock Aadhaar Fetcher
  const handleMockAadhaarFetch = () => {
    setAadhaarError(null);
    if (!aadhaar.trim()) {
      onAadhaarChange('2345 6789 0123');
    }

    setIsFetching(true);
    setTimeout(() => {
      // Randomly pick one of the 3 mock data profiles
      const randomIndex = Math.floor(Math.random() * MOCK_AADHAAR_PROFILES.length);
      const selectedProfile = MOCK_AADHAAR_PROFILES[randomIndex];

      onAadhaarVerifiedChange(true);
      if (onProfileFetched) {
        onProfileFetched(selectedProfile);
      }
      setIsFetching(false);
    }, 1500);
  };

  // Request Bluetooth Permission
  const handleRequestBluetooth = async () => {
    setBtRequesting(true);
    setBtStatusText('Requesting device Bluetooth access...');

    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      // Graceful fallback for non-supporting browsers
      onBluetoothEnabledChange(true);
      setBtStatusText('Bluetooth permission recorded (Simulated / Browser fallback)');
      setBtRequesting(false);
      return;
    }

    try {
      // Prompt user via Web Bluetooth API (generic discovery filter)
      // If user dismisses or device has no BT, handle gracefully without blocking
      await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      onBluetoothEnabledChange(true);
      setBtStatusText('Bluetooth permission granted for offline mesh relay');
    } catch (err: any) {
      console.info('Bluetooth permission skipped or declined by user:', err);
      // If user cancels or permission denied, record status without breaking flow
      if (err.name === 'NotFoundError' || err.name === 'NotAllowedError') {
        onBluetoothEnabledChange(false);
        setBtStatusText('Bluetooth permission declined / unavailable (wizard can still proceed)');
      } else {
        onBluetoothEnabledChange(true);
        setBtStatusText('Bluetooth access registered for emergency mesh relay');
      }
    } finally {
      setBtRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Advisory Note */}
      <div className="bg-blue-50 border-l-4 border-[#0B3D6E] p-3.5 rounded-r-sm text-xs text-blue-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#0B3D6E] flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-gray-900">National Citizen Emergency Registry (Peacetime Verification)</div>
          <div className="text-gray-700 mt-0.5">
            Verifying your mobile number links emergency shelter alerts, family roster synchronization, and offline disaster guides to your device.
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 p-3 rounded-sm text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Phone Number & OTP Verification */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#0B3D6E]" />
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              1.1 Mobile Number & OTP Verification / मोबाइल सत्यापन <span className="text-red-600">*</span>
            </h3>
          </div>
          {isPhoneVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              VERIFIED
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="phone-input" className="block text-xs font-semibold text-gray-800 mb-1">
              Mobile Number (10 Digits) / 10 अंकों का मोबाइल नंबर <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500 select-none">
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  maxLength={10}
                  disabled={isPhoneVerified}
                  value={phone}
                  onChange={(e) => {
                    onPhoneChange(e.target.value.replace(/\D/g, ''));
                    if (isPhoneVerified) onPhoneVerifiedChange(false);
                  }}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-3 py-2 text-sm border-2 border-gray-300 focus:border-[#0B3D6E] rounded-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-600 font-mono"
                />
              </div>

              {!isPhoneVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending || phone.replace(/\D/g, '').length !== 10}
                  className="bg-[#0B3D6E] hover:bg-[#07284B] active:bg-[#04172C] text-white text-xs font-semibold px-4 py-2 rounded-sm border border-blue-900 shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* OTP Input Row */}
          {otpSent && !isPhoneVerified && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm space-y-2">
              <label htmlFor="otp-input" className="block text-xs font-semibold text-gray-800">
                Enter 6-Digit OTP / ओटीपी दर्ज करें (Demo code: <span className="font-mono text-[#0B3D6E] font-bold">{demoOtpHint || '123456'}</span>)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full sm:w-44 px-3 py-2 text-sm font-mono text-center tracking-widest border-2 border-gray-400 focus:border-[#0B3D6E] rounded-sm bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpValue.trim().length !== 6}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-sm shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {otpError && (
            <p className="text-xs text-red-700 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {otpError}
            </p>
          )}

          {otpSuccessMessage && (
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {otpSuccessMessage}
            </p>
          )}
        </div>
      </div>

      {/* SECTION 2: Mock Aadhaar Government ID Verification */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0B3D6E]" />
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              1.2 National ID (Aadhaar / UIDAI Mock) / आधार सत्यापन (Optional Demo)
            </h3>
          </div>
          {isAadhaarVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              UID MATCHED
            </span>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-gray-600">
            For demonstration of UIDAI demographic handshake. Enter any 12-digit number (e.g., 2345 6789 0123).
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="aadhaar-input"
              type="text"
              maxLength={14}
              disabled={isAadhaarVerified}
              value={aadhaar}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                // Format as XXXX XXXX XXXX
                const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                onAadhaarChange(formatted);
                if (isAadhaarVerified) onAadhaarVerifiedChange(false);
              }}
              placeholder="XXXX XXXX XXXX (12 Digits)"
              className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 focus:border-[#0B3D6E] rounded-sm text-gray-900 font-mono disabled:bg-gray-100"
            />

            {!isAadhaarVerified ? (
              <button
                type="button"
                onClick={handleMockAadhaarFetch}
                disabled={isFetching}
                className="mt-2 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs rounded-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <span>Verify &amp; Fetch Details</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onAadhaarVerifiedChange(false);
                }}
                className="mt-2 sm:mt-0 bg-gray-100 hover:bg-gray-200 text-[#0B3D6E] text-xs font-semibold px-3 py-1.5 rounded-sm border border-gray-300 shadow-xs cursor-pointer"
              >
                Re-fetch
              </button>
            )}
          </div>

          {aadhaarError && (
            <p className="text-xs text-red-700 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {aadhaarError}
            </p>
          )}

          {isAadhaarVerified && (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Identity verified. Data fetched successfully.</span>
            </p>
          )}
        </div>
      </div>

      {/* SECTION 3: Web Bluetooth Permission (Offline Mesh Relay Flag) */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5 rounded-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <Bluetooth className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase">
            1.3 Offline Peer-to-Peer Relay Capability / ब्लूटूथ आपातकालीन रिले
          </h3>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed">
          Enabling Bluetooth permission allows your device to securely relay SOS signals to nearby rescue teams and disaster response drones when cellular towers fail.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 border border-gray-200 p-3 rounded-sm">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-full ${bluetoothEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">
                {bluetoothEnabled ? 'Bluetooth Relay Permitted (Active)' : 'Bluetooth Relay Not Yet Enabled'}
              </div>
              <div className="text-[11px] text-gray-600">{btStatusText}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestBluetooth}
            disabled={btRequesting}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-sm border transition-colors flex items-center justify-center gap-1.5 ${
              bluetoothEnabled
                ? 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                : 'bg-[#0B3D6E] text-white border-blue-900 hover:bg-[#07284B]'
            }`}
          >
            {btRequesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking Device...</span>
              </>
            ) : bluetoothEnabled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Permission Granted</span>
              </>
            ) : (
              <span>Request Bluetooth Access</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
