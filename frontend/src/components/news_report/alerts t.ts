export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface PublicAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string; // ISO 8601 string
  state?: string; // e.g. "Maharashtra", "Karnataka", "National"
}


export interface PublicAlertsResponse {
  alerts: PublicAlert[];
  page: number;
  hasMore: boolean;
}
