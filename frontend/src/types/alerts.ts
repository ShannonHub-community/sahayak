export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface PublicAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
}

export interface PublicAlertsResponse {
  alerts: PublicAlert[];
  page: number;
  hasMore: boolean;
}
