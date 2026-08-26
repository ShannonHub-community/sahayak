export interface SMSAlert {
  id: string;
  zone_id: string;
  message: string;
  sent_by: string;
  sent_at: string;
}

export interface PressRelease {
  id: string;
  template_id: string;
  content: string;
  published_by: string;
  published_at: string;
}

export interface NewsTimelineEntry {
  id: string;
  source_event_id: string;
  formatted_entry: string;
  category: 'rescue' | 'medical' | 'relief' | 'infrastructure' | 'weather';
  severity: 'critical' | 'warning' | 'info';
  public_visible: boolean;
  created_at: string;
}

export interface ZoneRiskData {
  zone_id: string;
  zone_name: string;
  flood_depth_m: number;
  active_sos_count: number;
  evacuation_status: 'Mandatory' | 'Advisory' | 'Safe';
  coordinates: [number, number]; // [lat, lng]
  radius_m: number;
}

export interface PressTemplate {
  id: string;
  name: string;
}

export interface PressReleaseDraft {
  content: string;
}

export interface CommsMetrics {
  active_incidents: number;
  personnel_deployed: number;
  relief_camps_open: number;
  relief_camps_capacity: number;
  flood_risk_level: number;
  medical_teams_active: number;
  road_closures: number;
  comms_network_health: number; // percentage
}
