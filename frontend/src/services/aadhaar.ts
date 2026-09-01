export interface AadhaarVerificationResponse {
  verified: boolean;
  referenceId: string;
  message: string;
}

export async function verifyAadhaarMock(aadhaarDigits: string): Promise<AadhaarVerificationResponse> {
  const clean = aadhaarDigits.replace(/\D/g, '');
  if (clean.length !== 12) {
    return {
      verified: false,
      referenceId: '',
      message: 'Aadhaar must be exactly 12 digits.',
    };
  }

  return {
    verified: true,
    referenceId: `UID-${Date.now().toString().slice(-6)}`,
    message: 'UIDAI Demographic Handshake Verified (Mock Demo).',
  };
}
