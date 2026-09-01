export interface CitizenLocation {
  lat: number;
  lng: number;
}

export interface FamilyMember {
  name: string;
  age: number;
  vulnerability_note?: string;
}

export interface CitizenRegistrationPayload {
  phone: string;
  name: string;
  age: number;
  gender: string;
  home_location: CitizenLocation;
  work_location?: CitizenLocation | null;
  blood_group: string;
  long_term_diseases: string[];
  bluetooth_enabled: boolean;
  family_members?: FamilyMember[];
}

export interface FirstAidGuide {
  title: string;
  steps: string[];
}

export interface FloodProtocolGuide {
  title: string;
  steps: string[];
}

export interface LocalShelterGuide {
  name: string;
  distance: string;
  cardinal: string;
  lat: number;
  lng: number;
}

export interface GuideBundle {
  first_aid_guide?: FirstAidGuide;
  flood_protocol_guide?: FloodProtocolGuide;
  local_shelters?: LocalShelterGuide[];
  disease_specific_guides?: Record<string, { title: string; protocol: string }>;
}

export interface RegistrationResponse {
  status: string;
  citizen_id: string;
  browser_identifier: string;
  message: string;
  guide_bundle?: GuideBundle;
}
