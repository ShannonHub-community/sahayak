export interface SOSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  isFallback?: boolean;
}

export interface NearestShelter {
  name: string;
  distance: string;
  cardinal: string;
  bearing: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacityPax?: number;
  category?: string;
}

export interface SOSPayload {
  citizen_id?: string | null;
  name: string;
  phone?: string | null;
  pax_count: number;
  medical_emergency: boolean;
  medical_condition?: string | null;
  includes_infants: boolean;
  includes_elderly: boolean;
  location: {
    lat: number;
    lng: number;
  };
  landmark?: string | null;
  transmission_method?: string;
  browser_session_id?: string;
}

export interface SOSResponse {
  status: string;
  report_id: string;
  message: string;
  nearest_shelter?: NearestShelter | null;
  timestamp: string;
}

export interface FamilyMember {
  name: string;
  age: number;
  vulnerability_note?: string;
}

export interface CitizenProfile {
  citizen_id: string;
  ble_peer_id?: string;
  name: string;
  phone: string;
  gender?: string;
  age?: number | '';
  blood_group?: string;
  medical_conditions?: string;
  long_term_diseases?: string[];
  family_members_count?: number;
  family_members?: FamilyMember[];
  home_location?: {
    lat: number;
    lng: number;
  };
  work_location?: {
    lat: number;
    lng: number;
  } | null;
  bluetooth_enabled?: boolean;
}
