export type TeamStatus = "Available" | "On Mission" | "Standby" | "Maintenance" | "Offline";
export type ReadinessLevel = "Level 1 (Immediate)" | "Level 2 (15 min)" | "Level 3 (Standby)";

export interface RescueTeam {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  members: string[];
  skills: string[];
  certifications: string[];
  assignedVehicle: string;
  equipment: string[];
  currentMission?: string;
  currentLocation: string;
  status: TeamStatus;
  readiness: ReadinessLevel;
  batteryLevel: number;
  connectivity: "Satellite" | "VHF 4G" | "Cellular" | "Offline";
  shift: string;
  missionCount: number;
  performanceScore: number; // Percentage
  avatar: string;
}

export interface Mission {
  id: string;
  title: string;
  sector: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  assignedTeamId?: string;
  assignedTeamName?: string;
  eta: string;
  status: "Pending" | "In Progress" | "Completed" | "Escalated";
  description: string;
  timestamp: string;
}