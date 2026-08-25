from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(
    title="Sahayak DEOC Command Backend API",
    version="1.0.0",
    description="Backend services for Panvel District Emergency Operations Centre (DEOC)"
)

# Enable CORS so Next.js frontend (localhost:3000) can communicate cleanly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Data Models
# --------------------------------------------------------------------------

class AssignmentHistoryItem(BaseModel):
    id: str
    taskName: str
    sector: str
    status: str
    timestamp: str

class Officer(BaseModel):
    id: str
    name: str
    role: str
    sector: str
    status: str
    phone: str
    assignmentHistory: List[AssignmentHistoryItem]

class Incident(BaseModel):
    id: str
    category: str
    ward: str
    severity: str
    description: str
    lat: float
    lng: float
    assignedTeam: Optional[str] = None
    status: str
    timestamp: str

class SOSRequest(BaseModel):
    id: str
    category: str
    ward: str
    severity: str
    description: str
    status: str
    assignedTeam: Optional[str] = None
    timestamp: str

class Resource(BaseModel):
    id: str
    name: str
    category: str
    allocatedWard: str
    total: int
    available: int
    unit: str
    status: str
    lastInspected: str

class ReliefCamp(BaseModel):
    id: str
    name: str
    location: str
    capacity: int
    occupancy: int
    status: str

class AuditLog(BaseModel):
    id: str
    action: str
    user: str
    target: str
    timestamp: str
    ip: str

class DispatchRequest(BaseModel):
    incidentId: str
    assignedTeam: str

class ReassignOfficerRequest(BaseModel):
    sector: Optional[str] = None
    status: Optional[str] = None

class MarkOfflineRequest(BaseModel):
    reason: Optional[str] = "Shift Ended"

class IntakeResourceRequest(BaseModel):
    name: str
    category: str
    allocatedWard: str
    total: int
    available: int
    unit: str
    status: str

# --------------------------------------------------------------------------
# In-Memory Database / State
# --------------------------------------------------------------------------

DB_OFFICERS: List[Officer] = [
    Officer(
        id="OFF-101",
        name="Insp. R. Sharma",
        role="NDRF Unit 1 (Rescue Lead)",
        sector="Ward 1 (Old Panvel)",
        status="On Field",
        phone="+91 98201 44321",
        assignmentHistory=[
            AssignmentHistoryItem(id="HIS-301", taskName="Riverbank Evacuation Ops", sector="Ward 1 (Old Panvel)", status="In Progress", timestamp="Today, 18:42 IST"),
            AssignmentHistoryItem(id="HIS-289", taskName="Sludge Pump Deployment", sector="Ward 3 (Station Road)", status="Completed", timestamp="Today, 14:15 IST"),
            AssignmentHistoryItem(id="HIS-254", taskName="Flood Risk Assessment Patrol", sector="Ward 2 (New Panvel)", status="Completed", timestamp="Yesterday, 09:30 IST")
        ]
    ),
    Officer(
        id="OFF-102",
        name="Dr. A. Verma",
        role="EMS Ambulance 3 (Medical Lead)",
        sector="Ward 4 (Kalamboli)",
        status="Dispatched",
        phone="+91 97110 88234",
        assignmentHistory=[
            AssignmentHistoryItem(id="HIS-304", taskName="Oxygen Cylinder Transport", sector="Ward 4 (Kalamboli)", status="In Progress", timestamp="Today, 18:28 IST"),
            AssignmentHistoryItem(id="HIS-277", taskName="Triage Setup at Shelter 2", sector="Ward 4 (Kalamboli)", status="Completed", timestamp="Today, 11:00 IST")
        ]
    ),
    Officer(
        id="OFF-103",
        name="Capt. S. Kadam",
        role="Civil Defense (Relief Overseer)",
        sector="Ward 5 (Khandeshwar)",
        status="Standby",
        phone="+91 94223 11902",
        assignmentHistory=[
            AssignmentHistoryItem(id="HIS-295", taskName="Ration Pack Distribution", sector="Ward 5 (Khandeshwar)", status="Completed", timestamp="Today, 15:30 IST")
        ]
    ),
    Officer(
        id="OFF-104",
        name="Station Officer V. Patil",
        role="Municipal Fire Squad 2",
        sector="Ward 3 (Station Road)",
        status="Standby",
        phone="+91 98692 55431",
        assignmentHistory=[
            AssignmentHistoryItem(id="HIS-282", taskName="100 HP Sludge Dewatering", sector="Ward 3 (Station Road)", status="Completed", timestamp="Today, 13:00 IST")
        ]
    ),
    Officer(
        id="OFF-105",
        name="Sub-Insp. M. Kadam",
        role="SDRF Water Rescue Unit",
        sector="Ward 2 (New Panvel)",
        status="Critical",
        phone="+91 99304 77123",
        assignmentHistory=[
            AssignmentHistoryItem(id="HIS-308", taskName="Rescue Boat Deep Water Patrol", sector="Ward 2 (New Panvel)", status="In Progress", timestamp="Today, 19:05 IST")
        ]
    )
]

DB_INCIDENTS: List[Incident] = [
    Incident(id="INC-101", category="Waterlogging", ward="Ward 3 (Station Road)", severity="High", description="3ft water accumulation blocking intersection", lat=18.9894, lng=73.1175, assignedTeam="Municipal Crew", status="Pending", timestamp="18:35 IST"),
    Incident(id="INC-102", category="Evacuation", ward="Ward 1 (Old Panvel)", severity="Critical", description="15 families stranded near riverbank", lat=18.9950, lng=73.1120, assignedTeam="NDRF Unit 1", status="Dispatched", timestamp="18:42 IST"),
    Incident(id="INC-103", category="Road Blocked", ward="Ward 5 (Khandeshwar)", severity="Medium", description="Submerged flyover underpass", lat=18.9820, lng=73.1250, assignedTeam="Public Works Dept", status="Pending", timestamp="18:15 IST")
]

DB_SOS: List[SOSRequest] = [
    SOSRequest(id="SOS-102", category="Evacuation", ward="Ward 1 (Old Panvel)", severity="Critical", description="15 families stranded near riverbank in low-lying residential cluster", status="Pending Approval", timestamp="18:42 IST"),
    SOSRequest(id="SOS-101", category="Waterlogging", ward="Ward 3 (Station Road)", severity="High", description="3ft water accumulation blocking main intersection", status="Pending Approval", timestamp="18:35 IST"),
    SOSRequest(id="SOS-104", category="Medical Emergency", ward="Ward 4 (Kalamboli)", severity="High", description="Elderly resident requires urgent oxygen transport", status="Dispatched", assignedTeam="EMS Ambulance 3", timestamp="18:28 IST")
]

DB_RESOURCES: List[Resource] = [
    Resource(id="RES-001", name="Inflatable Rescue Boat (IRB-250)", category="Boats", allocatedWard="Ward 1 (Old Panvel)", total=8, available=6, unit="Boats", status="Operational", lastInspected="Today, 08:00 IST"),
    Resource(id="RES-002", name="100 HP Sludge Dewatering Pump", category="Pumps", allocatedWard="Ward 3 (Station Road)", total=12, available=4, unit="Pumps", status="In Use", lastInspected="Today, 10:30 IST"),
    Resource(id="RES-003", name="Advanced Life Support Ambulance", category="Ambulances", allocatedWard="Ward 4 (Kalamboli)", total=5, available=3, unit="Vehicles", status="Operational", lastInspected="Today, 07:15 IST"),
    Resource(id="RES-004", name="62.5 kVA Diesel Mobile Generator", category="Generators", allocatedWard="Ward 5 (Khandeshwar)", total=10, available=8, unit="Units", status="Operational", lastInspected="Yesterday, 18:00 IST"),
    Resource(id="RES-005", name="High-Capacity Submersible Water Pump", category="Pumps", allocatedWard="Ward 2 (New Panvel)", total=6, available=1, unit="Pumps", status="Critical Stock", lastInspected="Today, 11:00 IST"),
    Resource(id="RES-006", name="Emergency Food & Water Ration Kits", category="Relief Supplies", allocatedWard="Panvel Central Warehouse", total=1500, available=1200, unit="Kits", status="Operational", lastInspected="Today, 06:00 IST")
]

DB_CAMPS: List[ReliefCamp] = [
    ReliefCamp(id="CMP-001", name="Panvel Municipal High School", location="Ward 1 (Old Panvel)", capacity=500, occupancy=340, status="Open"),
    ReliefCamp(id="CMP-002", name="Kalamboli Community Center", location="Ward 4 (Kalamboli)", capacity=400, occupancy=290, status="Open"),
    ReliefCamp(id="CMP-003", name="Khandeshwar Sports Complex", location="Ward 5 (Khandeshwar)", capacity=600, occupancy=570, status="Full")
]

DB_LOGS: List[AuditLog] = [
    AuditLog(id="LOG-901", action="Resource Lock Approved", user="Officer R. Sharma", target="NDRF Unit 1 -> SOS-102", timestamp="18:42:10 IST", ip="192.168.1.15"),
    AuditLog(id="LOG-902", action="Emergency Level Raised", user="Duty Officer (RDC)", target="Panvel Sector 4", timestamp="18:30:04 IST", ip="192.168.1.10"),
    AuditLog(id="LOG-903", action="Dewatering Pump Allocation", user="Insp. V. Patil", target="Station Road (Ward 3)", timestamp="18:15:22 IST", ip="192.168.1.22"),
    AuditLog(id="LOG-904", action="AI Action Approved", user="Officer R. Sharma", target="AI Recommendation #42", timestamp="17:55:00 IST", ip="192.168.1.15")
]

# --------------------------------------------------------------------------
# API Endpoints
# --------------------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "Sahayak DEOC Command Backend Running Live", "status": "ONLINE", "version": "1.0.0"}

@app.get("/api/v1/officers", response_model=List[Officer])
def get_officers():
    return DB_OFFICERS

def find_officer(officer_id: str) -> Optional[Officer]:
    clean = officer_id.strip().upper()
    for officer in DB_OFFICERS:
        off_upper = officer.id.upper()
        if off_upper == clean or off_upper == f"OFF-{clean}" or clean in off_upper:
            return officer
    return None

@app.get("/api/v1/officers/{officer_id}", response_model=Officer)
def get_officer(officer_id: str):
    officer = find_officer(officer_id)
    if officer:
        return officer
    raise HTTPException(status_code=404, detail=f"Officer ID '{officer_id}' not found. Valid IDs: {[o.id for o in DB_OFFICERS]}")

@app.put("/api/v1/officers/{officer_id}/status")
def reassign_officer(officer_id: str, payload: ReassignOfficerRequest):
    officer = find_officer(officer_id)
    if officer:
        if payload.sector:
            officer.sector = payload.sector
        if payload.status:
            officer.status = payload.status
        now = datetime.now().strftime("%H:%M:%S IST")
        new_log = AuditLog(
            id=f"LOG-{len(DB_LOGS)+901}",
            action=f"Officer Reassigned to {payload.sector or officer.sector}",
            user="Duty Officer (DEOC)",
            target=f"{officer.name} ({officer.id})",
            timestamp=now,
            ip="127.0.0.1"
        )
        DB_LOGS.insert(0, new_log)
        return {"success": True, "officer": officer}
    raise HTTPException(status_code=404, detail=f"Officer ID '{officer_id}' not found. Valid IDs: {[o.id for o in DB_OFFICERS]}")

@app.put("/api/v1/officers/{officer_id}/offline")
def mark_officer_offline(officer_id: str, payload: MarkOfflineRequest):
    officer = find_officer(officer_id)
    if officer:
        officer.status = "Standby"
        now = datetime.now().strftime("%H:%M:%S IST")
        new_log = AuditLog(
            id=f"LOG-{len(DB_LOGS)+901}",
            action=f"Officer Marked Offline ({payload.reason or 'Shift Ended'})",
            user="Duty Officer (DEOC)",
            target=f"{officer.name} ({officer.id})",
            timestamp=now,
            ip="127.0.0.1"
        )
        DB_LOGS.insert(0, new_log)
        return {"success": True, "officer": officer}
    raise HTTPException(status_code=404, detail=f"Officer ID '{officer_id}' not found. Valid IDs: {[o.id for o in DB_OFFICERS]}")

@app.get("/api/v1/incidents", response_model=List[Incident])
def get_incidents():
    return DB_INCIDENTS

@app.get("/api/v1/sos-requests", response_model=List[SOSRequest])
def get_sos_requests():
    return DB_SOS

@app.get("/api/v1/resources", response_model=List[Resource])
def get_resources():
    return DB_RESOURCES

@app.post("/api/v1/resources")
def intake_resource(payload: IntakeResourceRequest):
    new_id = f"RES-00{len(DB_RESOURCES)+1}"
    now = datetime.now().strftime("Today, %H:%M IST")
    res = Resource(
        id=new_id,
        name=payload.name,
        category=payload.category,
        allocatedWard=payload.allocatedWard,
        total=payload.total,
        available=payload.available,
        unit=payload.unit,
        status=payload.status,
        lastInspected=now
    )
    DB_RESOURCES.append(res)
    # Log audit entry
    log_time = datetime.now().strftime("%H:%M:%S IST")
    DB_LOGS.insert(0, AuditLog(
        id=f"LOG-{len(DB_LOGS)+901}",
        action="Inventory Intaked",
        user="Depot Manager",
        target=f"{payload.name} ({new_id})",
        timestamp=log_time,
        ip="127.0.0.1"
    ))
    return {"success": True, "resource": res}

@app.get("/api/v1/camps", response_model=List[ReliefCamp])
def get_camps():
    return DB_CAMPS

@app.get("/api/v1/audit-logs", response_model=List[AuditLog])
def get_audit_logs():
    return DB_LOGS

@app.post("/api/v1/dispatch")
def dispatch_unit(payload: DispatchRequest):
    for inc in DB_INCIDENTS:
        if inc.id == payload.incidentId:
            inc.status = "Dispatched"
            inc.assignedTeam = payload.assignedTeam
            
            # Log audit entry
            now = datetime.now().strftime("%H:%M:%S IST")
            DB_LOGS.insert(0, AuditLog(
                id=f"LOG-{len(DB_LOGS)+901}",
                action="Resource Lock & Unit Dispatched",
                user="Duty Officer (DEOC)",
                target=f"{payload.assignedTeam} -> {payload.incidentId}",
                timestamp=now,
                ip="127.0.0.1"
            ))
            return {"success": True, "message": f"Unit {payload.assignedTeam} dispatched to {inc.id}"}
    
    # Check SOS queue as well
    for sos in DB_SOS:
        if sos.id == payload.incidentId:
            sos.status = "Dispatched"
            sos.assignedTeam = payload.assignedTeam
            
            # Log audit entry
            now = datetime.now().strftime("%H:%M:%S IST")
            DB_LOGS.insert(0, AuditLog(
                id=f"LOG-{len(DB_LOGS)+901}",
                action="Resource Lock & Unit Dispatched",
                user="Duty Officer (DEOC)",
                target=f"{payload.assignedTeam} -> {payload.incidentId}",
                timestamp=now,
                ip="127.0.0.1"
            ))
            return {"success": True, "message": f"Unit {payload.assignedTeam} dispatched to {sos.id}"}

    raise HTTPException(status_code=404, detail="Incident or SOS ID not found")
