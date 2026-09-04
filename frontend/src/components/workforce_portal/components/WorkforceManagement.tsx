// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  MapPin, 
  Shield, 
  Truck, 
  Users, 
  Wrench, 
  Sparkles,
  ChevronRight,
  Radio
} from "lucide-react";

interface RescueTeam {
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
  status: "Available" | "On Mission" | "Standby" | "Maintenance" | "Offline";
  readiness: string;
  batteryLevel: number;
  connectivity: string;
  shift: string;
  missionCount: number;
  performanceScore: number;
  avatar: string;
}

const INITIAL_MOCK_TEAMS: RescueTeam[] = [
  {
    id: "NDRF-T1",
    name: "NDRF 5th Battalion Alpha",
    leader: "Insp. R. Sharma",
    memberCount: 8,
    members: ["R. Sharma", "A. Kumar", "V. Singh", "M. Kadam", "P. Patil", "S. Pawar", "D. Mane", "K. Shinde"],
    skills: ["Flood Rescue", "Deep Water Diving", "Collapsed Structure"],
    certifications: ["NDRF Master Diver", "HAZMAT Response Level 2"],
    assignedVehicle: "Rescue Truck MH-06-B-1204",
    equipment: ["2x IRB-250 Boats", "Submersible Pumps", "Satellite Radio"],
    currentMission: "Evacuation at Old Panvel Sector 4",
    currentLocation: "Old Panvel (Ward 1)",
    status: "On Mission",
    readiness: "Level 1 (Immediate)",
    batteryLevel: 92,
    connectivity: "Satellite",
    shift: "08:00 - 20:00 IST",
    missionCount: 14,
    performanceScore: 98,
    avatar: "🛟",
  },
  {
    id: "EMS-M3",
    name: "District Medical Response Unit 3",
    leader: "Dr. A. Verma",
    memberCount: 5,
    members: ["Dr. A. Verma", "Nurse S. Gupta", "Paramedic K. Das", "Driver G. More", "Attendant L. Thorat"],
    skills: ["Triage Medical", "Advanced Life Support", "Oxygen Transport"],
    certifications: ["ALS Certified", "Disaster Emergency Medicine"],
    assignedVehicle: "ALS Ambulance MH-06-A-9081",
    equipment: ["Portable Oxygen Concentrators", "AED", "Trauma Kits"],
    currentMission: "Oxygen Cylinder Transport - Kalamboli",
    currentLocation: "Kalamboli (Ward 4)",
    status: "On Mission",
    readiness: "Level 1 (Immediate)",
    batteryLevel: 85,
    connectivity: "VHF 4G",
    shift: "08:00 - 20:00 IST",
    missionCount: 22,
    performanceScore: 95,
    avatar: "🚑",
  },
  {
    id: "CIV-D2",
    name: "Civil Defense Flood Response Unit",
    leader: "Capt. S. Kadam",
    memberCount: 6,
    members: ["S. Kadam", "T. Deshmukh", "N. Bhosale", "Y. Gaikwad", "J. Solanki", "B. Rathod"],
    skills: ["Shelter Management", "Community Rationing", "First Aid"],
    certifications: ["State Civil Defense Badge", "First Responder"],
    assignedVehicle: "Utility Van MH-06-C-4102",
    equipment: ["Dewatering Sludge Pumps", "Emergency Rations", "Life Jackets"],
    currentLocation: "Khandeshwar (Ward 5)",
    status: "Available",
    readiness: "Level 1 (Immediate)",
    batteryLevel: 100,
    connectivity: "Cellular",
    shift: "20:00 - 08:00 IST",
    missionCount: 9,
    performanceScore: 91,
    avatar: "🛡️",
  },
  {
    id: "FIRE-T2",
    name: "Panvel Municipal Fire Squad 2",
    leader: "Station Officer V. Patil",
    memberCount: 6,
    members: ["V. Patil", "H. Jadhav", "R. Sawant", "S. Nikam", "U. Wagh", "F. Shaikh"],
    skills: ["Dewatering Operations", "Tree Removal", "HAZMAT Control"],
    certifications: ["National Fire Service Diploma"],
    assignedVehicle: "Heavy Water Tender MH-06-F-0012",
    equipment: ["100 HP Sludge Pump", "Hydraulic Cutters", "Searchlights"],
    currentLocation: "Station Road (Ward 3)",
    status: "Standby",
    readiness: "Level 2 (15 min)",
    batteryLevel: 78,
    connectivity: "VHF 4G",
    shift: "08:00 - 20:00 IST",
    missionCount: 18,
    performanceScore: 96,
    avatar: "🚒",
  },
];

interface WorkforceManagementProps {
  onSelectOfficer?: (officer: any) => void;
}

const PRESET_MISSIONS = [
  {
    title: "SOS-102: Evacuation of Stranded Citizens near Riverbank",
    sector: "Old Panvel (Ward 1)",
    priority: "Critical",
    notes: "Deploy high-buoyancy inflatable boats and floatation gear. 15 families stranded.",
  },
  {
    title: "SOS-101: Dewatering & Sludge Pumping at Station Road Underpass",
    sector: "Station Road (Ward 3)",
    priority: "High",
    notes: "Deploy heavy submersible pumps. Clear 3ft waterlogging blocking emergency vehicles.",
  },
  {
    title: "SOS-104: Emergency Oxygen Cylinder & Medical Kit Transport",
    sector: "Kalamboli (Ward 4)",
    priority: "Critical",
    notes: "Urgent medical relief for critical patients at Sector 4 clinic.",
  },
  {
    title: "SOS-107: Fallen Tree Clearance & Powerline Debris Removal",
    sector: "New Panvel (Ward 2)",
    priority: "Medium",
    notes: "Utilize hydraulic cutters and chainsaws to reopen arterial road.",
  },
  {
    title: "SOS-112: Riverbank Embankment & Sandbag Reinforcement",
    sector: "Khandeshwar (Ward 5)",
    priority: "High",
    notes: "Distribute sandbags and reinforce weak river embankment spots.",
  },
];

const SECTORS = [
  "Old Panvel (Ward 1)",
  "New Panvel (Ward 2)",
  "Station Road (Ward 3)",
  "Kalamboli (Ward 4)",
  "Khandeshwar (Ward 5)",
  "Central Disaster Base HQ",
];

const AVATAR_OPTIONS = [
  { emoji: "🛟", label: "NDRF Flood / Water Rescue" },
  { emoji: "🚑", label: "EMS Medical / Paramedic" },
  { emoji: "🚒", label: "Fire & HAZMAT Rescue" },
  { emoji: "🛡️", label: "State Civil Defense" },
  { emoji: "🚁", label: "Airborne / Reconnaissance" },
  { emoji: "⚡", label: "Quick Strike Force" },
];

export default function WorkforceManagement({ onSelectOfficer }: WorkforceManagementProps = {}) {
  // Initialize cleanly without SSR hydration mismatch
  const [teams, setTeams] = useState<RescueTeam[]>(INITIAL_MOCK_TEAMS);

  const [viewMode, setViewMode] = useState<"CARD" | "TABLE">("CARD");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [deployingTeam, setDeployingTeam] = useState<RescueTeam | null>(null);
  const [isEditingDuty, setIsEditingDuty] = useState<boolean>(false);

  // Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Load from localStorage only on client after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sahayak_roster_teams");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeams(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load saved teams", e);
    }
  }, []);

  // Save to localStorage whenever teams change
  useEffect(() => {
    try {
      localStorage.setItem("sahayak_roster_teams", JSON.stringify(teams));
    } catch (e) {
      console.error("Failed to persist teams", e);
    }
  }, [teams]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
  };

  // Registration Form State
  const [newTeamForm, setNewTeamForm] = useState({
    name: "",
    leader: "",
    memberCount: 6,
    members: "A. Kumar, S. Verma, R. Patil, P. Jadhav, M. Kadam, D. Shinde",
    skills: "Flood Rescue, Boat Handling, First Aid",
    certifications: "NDRF First Responder Certified",
    assignedVehicle: "Rescue Van MH-06-BW-4412",
    equipment: "2x Inflatable Boats, Submersible Pump, VHF Radio",
    currentLocation: "Old Panvel (Ward 1)",
    status: "Available" as "Available" | "On Mission" | "Standby",
    readiness: "Level 1 (Immediate)",
    shift: "08:00 - 20:00 IST",
    avatar: "🛟",
  });

  // Deploy / Assign Form State
  const [deployForm, setDeployForm] = useState({
    presetIndex: "0",
    missionTitle: PRESET_MISSIONS[0].title,
    sector: PRESET_MISSIONS[0].sector,
    priority: PRESET_MISSIONS[0].priority,
    notes: PRESET_MISSIONS[0].notes,
  });

  // Duty Record Edit Form State
  const [dutyEditForm, setDutyEditForm] = useState({
    status: "Available",
    shift: "08:00 - 20:00 IST",
    assignedVehicle: "",
    currentLocation: "",
    equipment: "",
    currentMission: "",
  });

  const [returnToProfileTeam, setReturnToProfileTeam] = useState<RescueTeam | null>(null);

  // Open Deploy Modal for a team
  const openDeployModal = (team: RescueTeam, fromProfile = false) => {
    if (fromProfile || selectedTeam) {
      setReturnToProfileTeam(team);
    } else {
      setReturnToProfileTeam(null);
    }
    setSelectedTeam(null);
    setIsEditingDuty(false);
    setIsRegisterModalOpen(false);
    setDeployingTeam(team);
    if (team.currentMission) {
      setDeployForm({
        presetIndex: "custom",
        missionTitle: team.currentMission,
        sector: team.currentLocation,
        priority: "Critical",
        notes: "Ongoing emergency deployment.",
      });
    } else {
      setDeployForm({
        presetIndex: "0",
        missionTitle: PRESET_MISSIONS[0].title,
        sector: PRESET_MISSIONS[0].sector,
        priority: PRESET_MISSIONS[0].priority,
        notes: PRESET_MISSIONS[0].notes,
      });
    }
  };

  // Open Register Modal
  const openRegisterModal = () => {
    setSelectedTeam(null);
    setIsEditingDuty(false);
    setDeployingTeam(null);
    setReturnToProfileTeam(null);
    setIsRegisterModalOpen(true);
  };

  // Open Team Profile Modal
  const openTeamDetails = (team: RescueTeam) => {
    setDeployingTeam(null);
    setIsRegisterModalOpen(false);
    setIsEditingDuty(false);
    setReturnToProfileTeam(null);
    setSelectedTeam(team);
  };

  // Open Duty Record Edit in Profile Modal
  const startEditingDuty = (team: RescueTeam) => {
    setIsEditingDuty(true);
    setDutyEditForm({
      status: team.status,
      shift: team.shift,
      assignedVehicle: team.assignedVehicle,
      currentLocation: team.currentLocation,
      equipment: team.equipment.join(", "),
      currentMission: team.currentMission || "",
    });
  };

  // Save Duty Record
  const handleSaveDutyRecord = () => {
    if (!selectedTeam) return;

    const updated = teams.map((t) => {
      if (t.id === selectedTeam.id) {
        return {
          ...t,
          status: dutyEditForm.status as any,
          shift: dutyEditForm.shift,
          assignedVehicle: dutyEditForm.assignedVehicle,
          currentLocation: dutyEditForm.currentLocation,
          currentMission: dutyEditForm.status === "On Mission" ? dutyEditForm.currentMission || t.currentMission : undefined,
          equipment: dutyEditForm.equipment.split(",").map((e) => e.trim()).filter(Boolean),
        };
      }
      return t;
    });

    setTeams(updated);
    const updatedSelected = updated.find((t) => t.id === selectedTeam.id) || null;
    setSelectedTeam(updatedSelected);
    setIsEditingDuty(false);
    showToast(`Duty record updated for ${selectedTeam.name}`, "success");
  };

  // Handle New Team Registration
  const handleRegisterTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamForm.name.trim() || !newTeamForm.leader.trim()) {
      alert("Please provide both Battalion / Team Name and Commander Name.");
      return;
    }

    const newId = `NDRF-T${teams.length + 1}`;
    const parsedMembers = newTeamForm.members
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const parsedSkills = newTeamForm.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedEquipment = newTeamForm.equipment
      .split(",")
      .map((eq) => eq.trim())
      .filter(Boolean);

    const createdTeam: RescueTeam = {
      id: newId,
      name: newTeamForm.name.trim(),
      leader: newTeamForm.leader.trim(),
      memberCount: Number(newTeamForm.memberCount) || parsedMembers.length || 6,
      members: parsedMembers.length > 0 ? parsedMembers : [newTeamForm.leader.trim()],
      skills: parsedSkills.length > 0 ? parsedSkills : ["Disaster Response", "Flood Rescue"],
      certifications: [newTeamForm.certifications || "State Disaster Response Unit Certified"],
      assignedVehicle: newTeamForm.assignedVehicle || "Quick Response Unit MH-06-A-0000",
      equipment: parsedEquipment.length > 0 ? parsedEquipment : ["Standard Field Equipment", "VHF Comms"],
      currentLocation: newTeamForm.currentLocation,
      status: newTeamForm.status,
      readiness: newTeamForm.readiness,
      batteryLevel: 100,
      connectivity: "VHF 4G",
      shift: newTeamForm.shift,
      missionCount: 0,
      performanceScore: 95,
      avatar: newTeamForm.avatar,
    };

    setTeams([createdTeam, ...teams]);
    setIsRegisterModalOpen(false);
    showToast(`Battalion ${createdTeam.name} (${createdTeam.id}) registered successfully!`, "success");

    // Reset Form
    setNewTeamForm({
      name: "",
      leader: "",
      memberCount: 6,
      members: "A. Kumar, S. Verma, R. Patil, P. Jadhav, M. Kadam, D. Shinde",
      skills: "Flood Rescue, Boat Handling, First Aid",
      certifications: "NDRF First Responder Certified",
      assignedVehicle: "Rescue Van MH-06-BW-4412",
      equipment: "2x Inflatable Boats, Submersible Pump, VHF Radio",
      currentLocation: "Old Panvel (Ward 1)",
      status: "Available",
      readiness: "Level 1 (Immediate)",
      shift: "08:00 - 20:00 IST",
      avatar: "🛟",
    });
  };

  // Handle Deploy / Dispatch Unit
  const handleConfirmDeployment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployingTeam) return;

    const missionName = deployForm.missionTitle.trim();
    if (!missionName) {
      alert("Please provide a mission name or select an active dispatch order.");
      return;
    }

    const updated = teams.map((t) => {
      if (t.id === deployingTeam.id) {
        return {
          ...t,
          status: "On Mission" as const,
          currentMission: missionName,
          currentLocation: deployForm.sector,
          missionCount: t.status === "On Mission" ? t.missionCount : t.missionCount + 1,
        };
      }
      return t;
    });

    setTeams(updated);

    if (selectedTeam && selectedTeam.id === deployingTeam.id) {
      setSelectedTeam({
        ...selectedTeam,
        status: "On Mission",
        currentMission: missionName,
        currentLocation: deployForm.sector,
        missionCount: selectedTeam.status === "On Mission" ? selectedTeam.missionCount : selectedTeam.missionCount + 1,
      });
    }

    const targetTeamName = deployingTeam.name;
    setDeployingTeam(null);
    showToast(`Unit ${targetTeamName} successfully deployed to "${missionName}"!`, "success");
  };

  // Handle Complete Mission / Return to Base
  const handleCompleteMission = (teamId: string) => {
    const updated = teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          status: "Available" as const,
          currentMission: undefined,
        };
      }
      return t;
    });

    setTeams(updated);

    if (selectedTeam && selectedTeam.id === teamId) {
      setSelectedTeam({
        ...selectedTeam,
        status: "Available",
        currentMission: undefined,
      });
    }

    setDeployingTeam(null);
    showToast(`Mission completed. Unit is now Available and in Standby.`, "info");
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 text-slate-800 font-sans relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[1000] flex items-center gap-3 bg-[#0B3D6E] text-white px-4 py-3 rounded-lg shadow-2xl border border-blue-400/40 animate-transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-blue-200 hover:text-white ml-2 p-1 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Controls */}
      <div className="bg-white border border-[#D7DEE7] p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F3A5F]">Workforce &amp; Rescue Team Roster</h2>
            <span className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
              {teams.length} Active Battalions
            </span>
          </div>
          <p className="text-xs text-slate-500">Real-Time Team Tracking, Deployment Readiness &amp; Capability Profiles</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 border border-slate-300 rounded p-0.5 flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("CARD")}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                viewMode === "CARD" ? "bg-[#1F3A5F] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Card View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                viewMode === "TABLE" ? "bg-[#1F3A5F] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Table View
            </button>
          </div>

          {/* Register New Team Trigger Button */}
          <button
            type="button"
            onClick={openRegisterModal}
            className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer relative z-10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Register New Team</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#D7DEE7] p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
        <input
          type="text"
          placeholder="Search team by ID, Leader, Skill, or Sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-slate-500 font-medium">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses ({teams.length})</option>
            <option value="Available">Available ({teams.filter((t) => t.status === "Available").length})</option>
            <option value="On Mission">On Mission ({teams.filter((t) => t.status === "On Mission").length})</option>
            <option value="Standby">Standby ({teams.filter((t) => t.status === "Standby").length})</option>
          </select>
        </div>
      </div>

      {/* Roster View - Card vs Table */}
      {viewMode === "CARD" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white border border-[#D7DEE7] rounded p-4 space-y-3.5 shadow-2xs hover:border-[#1565C0] transition-colors"
            >
              <div className="flex items-start justify-between border-b border-[#D7DEE7] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-xl">
                    {team.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#1F3A5F]">{team.name}</h3>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{team.id}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Commander:{" "}
                      <button
                        type="button"
                        onClick={() =>
                          onSelectOfficer?.({
                            id: `OFF-${team.id}`,
                            name: team.leader,
                            role: `${team.name} Commander`,
                            sector: team.currentLocation,
                            status: team.status === "On Mission" ? "On Field" : team.status,
                            phone: "+91 98201 44521",
                            assignmentHistory: [
                              {
                                id: "AH-1",
                                taskName: team.currentMission || "Active Deployment",
                                sector: team.currentLocation,
                                status: "In Progress",
                                timestamp: "Today, 08:00 IST",
                              },
                            ],
                          })
                        }
                        className="text-[#1565C0] hover:underline font-bold cursor-pointer"
                        title="Click to inspect Commander profile"
                      >
                        {team.leader} →
                      </button>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    team.status === "On Mission"
                      ? "bg-red-100 text-[#B91C1C] border border-red-300"
                      : team.status === "Available"
                      ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  {team.status}
                </span>
              </div>

              {team.currentMission && (
                <div className="bg-amber-50/70 border border-amber-200 rounded p-2 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                  <div className="truncate">
                    <span className="text-[10px] font-bold uppercase text-amber-900 block">Current Mission:</span>
                    <span className="font-semibold text-slate-900">{team.currentMission}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-[#FAFCFE] p-2.5 rounded border border-[#D7DEE7]">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Current Sector</span>
                  <span className="font-medium text-slate-900">{team.currentLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Personnel Count</span>
                  <span className="font-medium text-slate-900">{team.memberCount} Officers</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Vehicle</span>
                  <span className="font-medium text-slate-900 truncate block">{team.assignedVehicle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Comms &amp; Battery</span>
                  <span className="font-mono text-slate-900">{team.connectivity} • {team.batteryLevel}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Capabilities</span>
                <div className="flex flex-wrap gap-1">
                  {team.skills.map((skill, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#D7DEE7] flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Performance: <strong className="text-[#2E7D32]">{team.performanceScore}%</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openTeamDetails(team);
                    }}
                    className="text-[#1565C0] hover:underline font-semibold text-xs cursor-pointer"
                  >
                    Full Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeployModal(team)}
                    className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Deploy / Assign</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#D7DEE7] rounded overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs table-admin">
            <thead className="bg-[#1F3A5F] text-white font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-3.5 py-2.5">Team ID</th>
                <th className="px-3.5 py-2.5">Team Name</th>
                <th className="px-3.5 py-2.5">Commander</th>
                <th className="px-3.5 py-2.5">Sector</th>
                <th className="px-3.5 py-2.5">Personnel</th>
                <th className="px-3.5 py-2.5">Comms</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5">Current Mission</th>
                <th className="px-3.5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{team.id}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{team.avatar}</span>
                      <span>{team.name}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectOfficer?.({
                          id: `OFF-${team.id}`,
                          name: team.leader,
                          role: `${team.name} Commander`,
                          sector: team.currentLocation,
                          status: team.status === "On Mission" ? "On Field" : team.status,
                          phone: "+91 98201 44521",
                          assignmentHistory: [
                            {
                              id: "AH-1",
                              taskName: team.currentMission || "Active Deployment",
                              sector: team.currentLocation,
                              status: "In Progress",
                              timestamp: "Today, 08:00 IST",
                            },
                          ],
                        })
                      }
                      className="text-[#1565C0] hover:underline font-bold cursor-pointer"
                      title="Inspect Commander"
                    >
                      {team.leader}
                    </button>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{team.currentLocation}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">{team.memberCount} Members</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{team.connectivity} ({team.batteryLevel}%)</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        team.status === "On Mission"
                          ? "bg-red-100 text-[#B91C1C] border border-red-300"
                          : team.status === "Available"
                          ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}
                    >
                      {team.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 max-w-[200px] truncate">
                    {team.currentMission ? (
                      <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        {team.currentMission}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None (Standby)</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <button 
                        type="button"
                        onClick={() => openTeamDetails(team)} 
                        className="text-[#1565C0] hover:underline font-semibold cursor-pointer"
                      >
                        Profile
                      </button>
                      <button 
                        type="button"
                        onClick={() => openDeployModal(team)}
                        className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white px-2.5 py-1 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Deploy / Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Register New Team ── */}
      {isRegisterModalOpen && (
        <div 
          className="fixed inset-0  bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-" style={{ zIndex: 9999 }}
          onClick={() => setIsRegisterModalOpen(false)}
        >
          <div 
            className="bg-white border border-[#D7DEE7] rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#1F3A5F] text-white flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F3A5F]">Register New Rescue Battalion</h3>
                  <p className="text-[11px] text-slate-500">Add an active NDRF, SDRF, or Fire rescue unit into the live incident roster</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsRegisterModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterTeam} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Battalion / Unit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NDRF 7th Battalion Bravo"
                    value={newTeamForm.name}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Commanding Officer / Leader *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Insp. M. Deshmukh"
                    value={newTeamForm.leader}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, leader: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit Icon / Type</label>
                  <select
                    value={newTeamForm.avatar}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, avatar: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                  >
                    {AVATAR_OPTIONS.map((opt) => (
                      <option key={opt.emoji} value={opt.emoji}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                  <select
                    value={newTeamForm.status}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, status: e.target.value as any })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                  >
                    <option value="Available">Available</option>
                    <option value="Standby">Standby</option>
                    <option value="On Mission">On Mission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Personnel Count</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTeamForm.memberCount}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, memberCount: Number(e.target.value) })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Sector / Location</label>
                  <select
                    value={newTeamForm.currentLocation}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, currentLocation: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                  >
                    {SECTORS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Vehicle</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy Water Tender MH-06-B-9981"
                    value={newTeamForm.assignedVehicle}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, assignedVehicle: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Roster Personnel (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. M. Deshmukh, K. Patil, S. Shinde, R. More"
                  value={newTeamForm.members}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, members: e.target.value })}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Skills &amp; Capabilities (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Flood Rescue, Deep Water Diving, Medical ALS"
                    value={newTeamForm.skills}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, skills: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Equipment Inventory (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2x Inflatable Boats, Submersible Pump"
                    value={newTeamForm.equipment}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, equipment: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Shift Hours</label>
                  <input
                    type="text"
                    value={newTeamForm.shift}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, shift: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Readiness Level</label>
                  <select
                    value={newTeamForm.readiness}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, readiness: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                  >
                    <option value="Level 1 (Immediate)">Level 1 (Immediate Deployment)</option>
                    <option value="Level 2 (15 min)">Level 2 (15 min Standby)</option>
                    <option value="Level 3 (Standby)">Level 3 (Base Standby)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D7DEE7]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-[#D7DEE7] rounded text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register &amp; Add to Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Deploy & Assign Mission ── */}
      {deployingTeam && (
        <div 
          className="fixed inset-0  bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-" style={{ zIndex: 9999 }}
          onClick={() => {
            if (returnToProfileTeam) {
              setSelectedTeam(returnToProfileTeam);
              setReturnToProfileTeam(null);
            }
            setDeployingTeam(null);
          }}
        >
          <div 
            className="bg-white border border-[#D7DEE7] rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-xl">
                  {deployingTeam.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F3A5F]">Deploy &amp; Assign Mission</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Unit: <strong>{deployingTeam.name}</strong> ({deployingTeam.id}) • Commander: {deployingTeam.leader}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (returnToProfileTeam) {
                    setSelectedTeam(returnToProfileTeam);
                    setReturnToProfileTeam(null);
                  }
                  setDeployingTeam(null);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="bg-[#FAFCFE] p-3 border border-[#D7DEE7] rounded flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Current Operational State</span>
                <span className="font-semibold text-slate-900">
                  {deployingTeam.currentLocation} • {deployingTeam.memberCount} Officers • {deployingTeam.assignedVehicle}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  deployingTeam.status === "On Mission"
                    ? "bg-red-100 text-[#B91C1C] border border-red-300"
                    : deployingTeam.status === "Available"
                    ? "bg-emerald-100 text-[#2E7D32] border border-emerald-300"
                    : "bg-slate-100 text-slate-700 border border-slate-300"
                }`}
              >
                {deployingTeam.status}
              </span>
            </div>

            {/* If currently On Mission, give option to complete */}
            {deployingTeam.status === "On Mission" && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Currently Assigned to: {deployingTeam.currentMission || "Active Deployment"}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  You can either assign a new priority operation to redirect this unit, or mark the ongoing mission as completed to return the unit to standby.
                </p>
                <button
                  type="button"
                  onClick={() => handleCompleteMission(deployingTeam.id)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Mission Completed &amp; Return to Base</span>
                </button>
              </div>
            )}

            <form onSubmit={handleConfirmDeployment} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quick Select Emergency Incident Queue</label>
                <select
                  value={deployForm.presetIndex}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setDeployForm({ ...deployForm, presetIndex: "custom" });
                    } else {
                      const idx = Number(val);
                      const p = PRESET_MISSIONS[idx];
                      if (p) {
                        setDeployForm({
                          presetIndex: val,
                          missionTitle: p.title,
                          sector: p.sector,
                          priority: p.priority,
                          notes: p.notes,
                        });
                      }
                    }
                  }}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                >
                  {PRESET_MISSIONS.map((p, idx) => (
                    <option key={idx} value={String(idx)}>
                      [{p.priority}] {p.title}
                    </option>
                  ))}
                  <option value="custom">✏️ Custom Operation / Other Sector Task...</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mission / Task Title *</label>
                <input
                  type="text"
                  required
                  value={deployForm.missionTitle}
                  onChange={(e) => setDeployForm({ ...deployForm, missionTitle: e.target.value, presetIndex: "custom" })}
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                  placeholder="e.g. Sludge Dewatering Operation at Sector 3"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Sector / Ward *</label>
                  <select
                    value={deployForm.sector}
                    onChange={(e) => setDeployForm({ ...deployForm, sector: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Operational Priority</label>
                  <select
                    value={deployForm.priority}
                    onChange={(e) => setDeployForm({ ...deployForm, priority: e.target.value })}
                    className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-2.5 py-1.5 rounded text-slate-800"
                  >
                    <option value="Critical">Critical (Immediate Dispatch)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Standard">Standard / Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dispatch Orders &amp; Tactical Briefing</label>
                <textarea
                  rows={2}
                  value={deployForm.notes}
                  onChange={(e) => setDeployForm({ ...deployForm, notes: e.target.value })}
                  placeholder="Special instructions for the battalion commander..."
                  className="w-full bg-[#FAFCFE] border border-[#D7DEE7] px-3 py-1.5 rounded focus:outline-none focus:border-[#1F3A5F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D7DEE7]">
                <button
                  type="button"
                  onClick={() => {
                    if (returnToProfileTeam) {
                      setSelectedTeam(returnToProfileTeam);
                      setReturnToProfileTeam(null);
                    }
                    setDeployingTeam(null);
                  }}
                  className="px-4 py-2 border border-[#D7DEE7] rounded text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {returnToProfileTeam ? "← Back to Profile" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Confirm Deployment &amp; Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Full Profile & Duty Record (as shown in user's screenshot) ── */}
      {selectedTeam && (
        <div 
          className="fixed inset-0  bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-" style={{ zIndex: 9999 }}
          onClick={() => {
            setSelectedTeam(null);
            setIsEditingDuty(false);
          }}
        >
          <div 
            className="bg-white border border-[#D7DEE7] rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedTeam.avatar}</span>
                <div>
                  <h3 className="font-bold text-sm text-[#1F3A5F]">{selectedTeam.name}</h3>
                  <span className="text-[10px] font-mono text-slate-500">ID: {selectedTeam.id} • {selectedTeam.readiness}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setIsEditingDuty(false);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editing Mode vs Viewing Mode */}
            {isEditingDuty ? (
              <div className="space-y-3 bg-blue-50/50 p-3.5 border border-blue-200 rounded">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#1F3A5F] text-xs">Update Operational Duty Record</h4>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-semibold">Editing</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={dutyEditForm.status}
                      onChange={(e) => setDutyEditForm({ ...dutyEditForm, status: e.target.value })}
                      className="w-full bg-white border border-[#D7DEE7] px-2 py-1 rounded text-slate-800"
                    >
                      <option value="Available">Available</option>
                      <option value="On Mission">On Mission</option>
                      <option value="Standby">Standby</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift Hours</label>
                    <input
                      type="text"
                      value={dutyEditForm.shift}
                      onChange={(e) => setDutyEditForm({ ...dutyEditForm, shift: e.target.value })}
                      className="w-full bg-white border border-[#D7DEE7] px-2 py-1 rounded text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Vehicle</label>
                    <input
                      type="text"
                      value={dutyEditForm.assignedVehicle}
                      onChange={(e) => setDutyEditForm({ ...dutyEditForm, assignedVehicle: e.target.value })}
                      className="w-full bg-white border border-[#D7DEE7] px-2 py-1 rounded text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Sector</label>
                    <select
                      value={dutyEditForm.currentLocation}
                      onChange={(e) => setDutyEditForm({ ...dutyEditForm, currentLocation: e.target.value })}
                      className="w-full bg-white border border-[#D7DEE7] px-2 py-1 rounded text-slate-800"
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Equipment Inventory (Comma-separated)</label>
                  <input
                    type="text"
                    value={dutyEditForm.equipment}
                    onChange={(e) => setDutyEditForm({ ...dutyEditForm, equipment: e.target.value })}
                    className="w-full bg-white border border-[#D7DEE7] px-2 py-1 rounded text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDuty(false)}
                    className="px-3 py-1 border border-slate-300 rounded text-slate-600 bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDutyRecord}
                    className="px-4 py-1 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-bold shadow-xs cursor-pointer"
                  >
                    Save Duty Record
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 bg-[#FAFCFE] p-3 border border-[#D7DEE7] rounded">
                  <div><strong>Commander:</strong> {selectedTeam.leader}</div>
                  <div><strong>Assigned Vehicle:</strong> {selectedTeam.assignedVehicle}</div>
                  <div><strong>Shift Hours:</strong> {selectedTeam.shift}</div>
                  <div><strong>Missions Completed:</strong> {selectedTeam.missionCount}</div>
                </div>

                {selectedTeam.currentMission && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block">Active Mission Assignment</span>
                    <span className="font-semibold text-slate-900">{selectedTeam.currentMission}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <strong className="text-[#1F3A5F] block">Roster Personnel ({selectedTeam.members.length}):</strong>
                  <div className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded text-[11px] leading-relaxed">
                    {selectedTeam.members.join(" • ")}
                  </div>
                </div>

                <div className="space-y-1">
                  <strong className="text-[#1F3A5F] block">Equipment Inventory:</strong>
                  <div className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded text-[11px]">
                    {selectedTeam.equipment.join(" • ")}
                  </div>
                </div>
              </>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D7DEE7]">
              <button 
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setIsEditingDuty(false);
                }} 
                className="px-3 py-1.5 border border-[#D7DEE7] rounded text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDeployModal(selectedTeam, true)}
                  className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Deploy / Assign</span>
                </button>

                {!isEditingDuty && (
                  <button 
                    type="button"
                    onClick={() => startEditingDuty(selectedTeam)}
                    className="px-4 py-1.5 bg-[#1F3A5F] hover:bg-[#1565C0] text-white rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Update Duty Record</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
