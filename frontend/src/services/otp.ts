export interface SendOtpResponse {
  success: boolean;
  txnId: string;
  demoOtp: string;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  // Simulated OTP sending for disaster demo
  return {
    success: true,
    txnId: `TXN-${Date.now().toString(36).toUpperCase()}`,
    demoOtp: '123456',
    message: `OTP sent to +91 ${cleanPhone}. (Use demo code 123456)`,
  };
}

export async function verifyOtp(phone: string, otp: string, _txnId?: string): Promise<VerifyOtpResponse> {
  const cleanOtp = otp.trim();
  if (cleanOtp === '123456' || cleanOtp.length === 6) {
    return {
      success: true,
      message: 'Mobile number verified successfully.',
    };
  }
  return {
    success: false,
    message: 'Invalid OTP code. Please enter 123456.',
  };
}
