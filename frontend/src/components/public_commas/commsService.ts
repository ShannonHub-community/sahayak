import { ZoneRiskData, SMSAlert, PressTemplate, PressRelease, PressReleaseDraft, NewsTimelineEntry, CommsMetrics } from './types';
import { 
  MOCK_ZONES, 
  MOCK_SMS_ALERTS, 
  MOCK_PRESS_TEMPLATES, 
  MOCK_PRESS_RELEASES, 
  MOCK_TIMELINE_ENTRIES,
  MOCK_COMMS_METRICS 
} from './mockData';

// Single toggle switch for backend integration
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || true;

// Mutable mock state for local testing when USE_MOCK_DATA is true
let mockSmsAlerts = [...MOCK_SMS_ALERTS];
let mockPressReleases = [...MOCK_PRESS_RELEASES];
let mockTimelineEntries = [...MOCK_TIMELINE_ENTRIES];

export const commsService = {
  /**
   * Retrieves high-level communications metrics.
   * FastAPI Route: GET /api/news_report/metrics
   */
  getMetrics: async (): Promise<CommsMetrics> => {
    if (USE_MOCK_DATA) {
      return MOCK_COMMS_METRICS;
    }
    // Real endpoint implementation goes here
    const res = await fetch('/api/news_report/metrics');
    return res.json();
  },

  /**
   * Retrieves the list of risk zones for map rendering and geofence selection.
   * FastAPI Route: GET /api/news_report/zones
   * Table: twin_state (or related spatial views)
   */
  getZones: async (): Promise<ZoneRiskData[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_ZONES;
    }
    const res = await fetch('/api/news_report/zones');
    return res.json();
  },

  /**
   * Calls the backend AI layer to generate an automated SMS draft based on zone risk telemetry.
   * FastAPI Route: POST /api/news_report/alerts/draft
   */
  generateAIDraftSMS: async (zoneId: string): Promise<string> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      const zone = MOCK_ZONES.find(z => z.zone_id === zoneId);
      if (!zone) return 'Error generating draft.';
      return `EMERGENCY ALERT: ${zone.zone_name} is under ${zone.evacuation_status} Evacuation due to ${zone.flood_depth_m}m flood levels. Move to higher ground immediately. Contact 108 for SOS.`;
    }
    const res = await fetch('/api/news_report/alerts/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone_id: zoneId })
    });
    const data = await res.json();
    return data.draft;
  },

  /**
   * Broadcasts an SMS alert to a target geofence.
   * FastAPI Route: POST /api/news_report/alerts
   * Table: sms_alerts
   */
  broadcastSMS: async (payload: Omit<SMSAlert, 'id' | 'sent_at'>): Promise<SMSAlert> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newAlert: SMSAlert = {
        id: `sms-${Date.now()}`,
        zone_id: payload.zone_id,
        message: payload.message,
        sent_by: payload.sent_by,
        sent_at: new Date().toISOString()
      };
      mockSmsAlerts = [newAlert, ...mockSmsAlerts];
      return newAlert;
    }
    const res = await fetch('/api/news_report/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  /**
   * Retrieves the list of standard press release templates.
   * FastAPI Route: GET /api/news_report/press/templates
   */
  getPressTemplates: async (): Promise<PressTemplate[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_PRESS_TEMPLATES;
    }
    const res = await fetch('/api/news_report/press/templates');
    return res.json();
  },

  /**
   * Calls the backend AI layer to generate a drafted press release from current telemetry data.
   * FastAPI Route: POST /api/news_report/press/draft
   */
  generateAIPressRelease: async (templateId: string): Promise<PressReleaseDraft> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const template = MOCK_PRESS_TEMPLATES.find(t => t.id === templateId);
      const title = template ? template.name : templateId;
      return {
        content: `[DRAFT - ${title}]\nFor Immediate Release\n${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\nEXECUTIVE SUMMARY\nIn response to the ongoing heavy rainfall, the municipal corporation has initiated a multi-ward rescue operation. Over the past 24 hours, NDRF and local fire services have safely evacuated 250 individuals from low-lying areas in Panvel and Kalamboli.\n\nCASUALTY & RESCUE STATISTICS\n- Total Evacuated: 250\n- Relief Camps Active: 4\n- Ongoing SOS Responses: 60\n\nPUBLIC INSTRUCTION\nCitizens are advised to avoid unnecessary travel and report emergencies to the central helpline.\n\nOfficial Emergency Contact: 108 / 112\n\n--- END OF RELEASE ---`
      };
    }
    const res = await fetch('/api/news_report/press/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId })
    });
    return res.json();
  },

  /**
   * Publishes an edited press release to the public portal.
   * FastAPI Route: POST /api/news_report/press
   * Table: press_releases
   */
  publishPressRelease: async (payload: Omit<PressRelease, 'id' | 'published_at'>): Promise<PressRelease> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newRelease: PressRelease = {
        id: `pr-${Date.now()}`,
        template_id: payload.template_id,
        content: payload.content,
        published_by: payload.published_by,
        published_at: new Date().toISOString()
      };
      mockPressReleases = [newRelease, ...mockPressReleases];
      return newRelease;
    }
    const res = await fetch('/api/news_report/press', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  /**
   * Retrieves the latest operational events for the public news timeline.
   * FastAPI Route: GET /api/news_report/timeline
   * Table: news_timeline
   */
  getTimelineEntries: async (): Promise<NewsTimelineEntry[]> => {
    if (USE_MOCK_DATA) {
      return [...mockTimelineEntries];
    }
    const res = await fetch('/api/news_report/timeline');
    return res.json();
  },

  /**
   * Toggles the public visibility of a timeline entry.
   * FastAPI Route: PATCH /api/news_report/timeline/{id}/visibility
   * Table: news_timeline
   */
  toggleEntryVisibility: async (id: string, public_visible: boolean): Promise<boolean> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      mockTimelineEntries = mockTimelineEntries.map(entry => 
        entry.id === id ? { ...entry, public_visible } : entry
      );
      return true;
    }
    const res = await fetch(`/api/news_report/timeline/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_visible })
    });
    return res.ok;
  }
};
