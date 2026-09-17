export type EntityType = 'sos' | 'medical' | 'shelter' | 'infra_damage' | 'flood_zone';

export interface TwinMapState {
  id: string;
  entity_type: EntityType | string;
  location: { lat: number; lng: number } | any;
  symbol: string;
  severity_count: number;
  status: string;
  last_updated: string;
  name?: string;
  depth?: string;
  river?: string;
  flowSpeed?: string;
  notes?: string;
}

export interface TwinDiffPayload {
  added: TwinMapState[];
  updated: TwinMapState[];
  removed: string[];
}
