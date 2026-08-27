import type { SOSPayload, SOSResponse } from '../types/sos';

const EMERGENCY_SMS_RECIPIENT = '112'; // National Emergency Dispatch Number

/**
 * Formats the standardized compact SOS payload for SMS transmission.
 * Format: SOS|Name|LAT|LON|PAX:<count>|STAT:<flags>
 */
export function formatOfflineSMS(payload: SOSPayload): string {
  const flags: string[] = [];
  if (payload.medical_emergency) flags.push('MED');
  if (payload.includes_infants) flags.push('INF');
  if (payload.includes_elderly) flags.push('ELD');

  const flagStr = flags.length > 0 ? flags.join(',') : 'NONE';
  const latStr = payload.location.lat.toFixed(5);
  const lngStr = payload.location.lng.toFixed(5);
  const landmarkPart = payload.landmark ? `|LMK:${payload.landmark.substring(0, 30)}` : '';

  return `SOS|${payload.name || 'CITIZEN'}|${latStr}|${lngStr}|PAX:${payload.pax_count}|STAT:${flagStr}${landmarkPart}`;
}

/**
 * Generates and triggers the native device SMS deep-link fallback.
 */
export function triggerSMSFallback(payload: SOSPayload): void {
  const messageBody = formatOfflineSMS({ ...payload, transmission_method: 'sms' });
  const encodedBody = encodeURIComponent(messageBody);

  // Cross-platform SMS URL scheme (Android / iOS / Desktop)
  // iOS uses &body= while Android/RFC standard uses ?body=
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsUrl = isIOS 
    ? `sms:${EMERGENCY_SMS_RECIPIENT}&body=${encodedBody}`
    : `sms:${EMERGENCY_SMS_RECIPIENT}?body=${encodedBody}`;

  if (typeof window !== 'undefined') {
    window.location.href = smsUrl;
  }
}

/**
 * Submits an SOS report via HTTP POST when online, or via SMS deep-link when offline.
 */
export async function submitSOS(payload: SOSPayload): Promise<SOSResponse> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    // Offline path: trigger native SMS
    triggerSMSFallback(payload);
    return {
      status: 'queued',
      report_id: `SMS-${Date.now().toString().slice(-6)}`,
      message: 'Internet unavailable. Emergency SMS draft created for dispatch 112.',
      timestamp: new Date().toISOString(),
    };
  }

  // Online path: POST to backend
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiBase}/api/sos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = 'Emergency transmission failed. Please use SMS or dial 112 directly.';
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  const result: SOSResponse = await response.json();
  return result;
}
