import { ZoneRiskData, SMSAlert, PressTemplate, PressRelease, NewsTimelineEntry, CommsMetrics } from './types';

export const MOCK_COMMS_METRICS: CommsMetrics = {
  active_incidents: 6,
  personnel_deployed: 18,
  relief_camps_open: 4,
  relief_camps_capacity: 1200,
  flood_risk_level: 3,
  medical_teams_active: 5,
  road_closures: 2,
  comms_network_health: 99.4,
};

export const MOCK_ZONES: ZoneRiskData[] = [
  { zone_id: 'z1', zone_name: 'Ward 1 (Old Panvel)', flood_depth_m: 1.2, active_sos_count: 14, evacuation_status: 'Mandatory', coordinates: [18.9894, 73.1175], radius_m: 600 },
  { zone_id: 'z2', zone_name: 'Ward 2 (New Panvel)', flood_depth_m: 0.4, active_sos_count: 2, evacuation_status: 'Advisory', coordinates: [18.9950, 73.1190], radius_m: 400 },
  { zone_id: 'z3', zone_name: 'Ward 3 (Station Road)', flood_depth_m: 2.1, active_sos_count: 45, evacuation_status: 'Mandatory', coordinates: [18.9902, 73.1235], radius_m: 750 },
  { zone_id: 'z4', zone_name: 'Ward 4 (Kalamboli)', flood_depth_m: 0.8, active_sos_count: 8, evacuation_status: 'Advisory', coordinates: [19.0150, 73.1050], radius_m: 650 },
  { zone_id: 'z5', zone_name: 'Ward 5 (Khandeshwar)', flood_depth_m: 0.1, active_sos_count: 0, evacuation_status: 'Safe', coordinates: [19.0065, 73.0950], radius_m: 550 },
];

export const MOCK_SMS_ALERTS: SMSAlert[] = [
  {
    id: 'sms-init-1',
    zone_id: 'z3',
    message: 'EMERGENCY ALERT: Ward 3 (Station Road) is under Mandatory Evacuation due to 2.1m flood levels. Move to higher ground immediately. Contact 108 for SOS.',
    sent_by: 'DEOC Admin Officer',
    sent_at: new Date(Date.now() - 3600000).toISOString(),
  }
];

export const MOCK_PRESS_TEMPLATES: PressTemplate[] = [
  { id: 'template-1', name: '24-Hour Multi-Ward Rescue & Evacuation Summary' },
  { id: 'template-2', name: 'Relief Camp Capacity & Medical Deployment Notice' },
  { id: 'template-3', name: 'Critical Infrastructure & Transport Route Advisory' },
  { id: 'template-4', name: 'Resource Ledger & Donation Utilization Statement' },
];

export const MOCK_PRESS_RELEASES: PressRelease[] = [
  {
    id: 'pr-init-1',
    template_id: 'template-1',
    content: '[DRAFT - 24-Hour Multi-Ward Rescue & Evacuation Summary]\nFor Immediate Release\n\nEXECUTIVE SUMMARY\nIn response to the ongoing heavy rainfall, the municipal corporation has initiated a multi-ward rescue operation. Over the past 24 hours, NDRF and local fire services have safely evacuated 250 individuals from low-lying areas in Panvel and Kalamboli.\n\nCASUALTY & RESCUE STATISTICS\n- Total Evacuated: 250\n- Relief Camps Active: 4\n- Ongoing SOS Responses: 60\n\nPUBLIC INSTRUCTION\nCitizens are advised to avoid unnecessary travel and report emergencies to the central helpline.\n\nOfficial Emergency Contact: 108 / 112\n\n--- END OF RELEASE ---',
    published_by: 'DEOC Admin Officer',
    published_at: new Date(Date.now() - 7200000).toISOString(),
  }
];

export const MOCK_TIMELINE_ENTRIES: NewsTimelineEntry[] = [
  { id: 't1', source_event_id: 'ev1', formatted_entry: '15 families safely evacuated from Ward 1 residential cluster by NDRF Unit 1', category: 'rescue', severity: 'warning', public_visible: true, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 't2', source_event_id: 'ev2', formatted_entry: 'Medical relief camp established at Khandeshwar Station area.', category: 'medical', severity: 'info', public_visible: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 't3', source_event_id: 'ev3', formatted_entry: 'Main bridge at Kalamboli reported structurally unsafe. Traffic diverted.', category: 'infrastructure', severity: 'critical', public_visible: true, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 't4', source_event_id: 'ev4', formatted_entry: 'Internal VHF network maintenance. Minor disruptions expected.', category: 'infrastructure', severity: 'info', public_visible: false, created_at: new Date(Date.now() - 12000000).toISOString() },
];
