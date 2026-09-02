// @ts-nocheck
"use client";

import React, { useState } from "react";

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

const MOCK_TEAMS: RescueTeam[] = [
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

export default function WorkforceManagement({ onSelectOfficer }: WorkforceManagementProps = {}) {
  const [viewMode, setViewMode] = useState<"CARD" | "TABLE">("CARD");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);

  const filteredTeams = MOCK_TEAMS.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 text-slate-800 font-sans">
      <div className="bg-white border border-[#D7DEE7] p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1F3A5F]">Workforce & Rescue Team Roster</h2>
            <span className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
              {MOCK_TEAMS.length} Active Battalions
            </span>
          </div>
          <p className="text-xs text-slate-500">Real-Time Team Tracking, Deployment Readiness & Capability Profiles</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 border border-slate-300 rounded p-0.5 flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode("CARD")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "CARD" ? "bg-[#1F3A5F] text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Card View
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "TABLE" ? "bg-[#1F3A5F] text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Table View
            </button>
          </div>

          <button className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors shadow-2xs">
            + Register New Team
          </button>
        </div>
      </div>

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
            <option value="ALL">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Mission">On Mission</option>
            <option value="Standby">Standby</option>
          </select>
        </div>
      </div>

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
                        className="text-[#1565C0] hover:underline font-bold"
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
                  <span className="font-medium text-slate-900">{team.assignedVehicle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Comms & Battery</span>
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
                <span className="text-slate-500 text-[11px]">Performance: <strong className="text-[#2E7D32]">{team.performanceScore}%</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="text-[#1565C0] hover:underline font-semibold text-xs"
                  >
                    Full Profile
                  </button>
                  <button className="bg-[#1F3A5F] hover:bg-[#1565C0] text-white text-xs font-semibold px-3 py-1 rounded">
                    Deploy / Assign
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
                <th className="px-3.5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7DEE7] text-slate-800">
              {filteredTeams.map((team) => (
                <tr key={team.id}>
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-[#1F3A5F]">{team.id}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{team.name}</td>
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
                      className="text-[#1565C0] hover:underline font-bold"
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
                  <td className="px-3.5 py-2.5 flex items-center gap-2">
                    <button onClick={() => setSelectedTeam(team)} className="text-[#1565C0] hover:underline font-semibold">
                      Profile
                    </button>
                    <button className="text-[#1F3A5F] hover:underline font-semibold">Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D7DEE7] rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-[#D7DEE7] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedTeam.avatar}</span>
                <div>
                  <h3 className="font-bold text-sm text-[#1F3A5F]">{selectedTeam.name}</h3>
                  <span className="text-[10px] font-mono text-slate-500">ID: {selectedTeam.id} • {selectedTeam.readiness}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTeam(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#FAFCFE] p-3 border border-[#D7DEE7] rounded">
              <div><strong>Commander:</strong> {selectedTeam.leader}</div>
              <div><strong>Assigned Vehicle:</strong> {selectedTeam.assignedVehicle}</div>
              <div><strong>Shift Hours:</strong> {selectedTeam.shift}</div>
              <div><strong>Missions Completed:</strong> {selectedTeam.missionCount}</div>
            </div>

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

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D7DEE7]">
              <button onClick={() => setSelectedTeam(null)} className="px-3 py-1.5 border border-[#D7DEE7] rounded text-slate-600 font-medium">
                Close
              </button>
              <button className="px-4 py-1.5 bg-[#1F3A5F] text-white rounded font-semibold">
                Update Duty Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}