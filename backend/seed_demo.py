"""
Sahayak - Deterministic Database Reset & Noise Data Seed Script.

This script resets and seeds background realism ("Noise Data") for live hackathons
and demonstrations directly into the SQLite database.

CRITICAL REQUIREMENT:
It seeds ONLY background noise (Sector 8 & Sector 2).
It NEVER seeds Sector 4 / Storyline data (45 pax, critical medical),
which will be executed LIVE via the user interface.
"""

import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configure UTF-8 encoding for Windows terminals so emoji prints don't fail
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Resolve DB paths
BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("SAHAYAK_DB_PATH", BACKEND_DIR / "sahayak.db"))
SOS_SERVICE_DB_PATH = BACKEND_DIR / "services" / "sos_service" / "sos.db"

# ---------------------------------------------------------------------------
# SQLite Schema Initialization (Ensures tables exist before wipe/seed)
# ---------------------------------------------------------------------------
INIT_SCHEMA_SQL = """
-- 1. citizens
CREATE TABLE IF NOT EXISTS citizens (
    id                  TEXT PRIMARY KEY,
    browser_identifier  TEXT,
    ble_peer_id         TEXT UNIQUE,
    phone               TEXT,
    name                TEXT NOT NULL,
    age                 INTEGER,
    gender              TEXT,
    home_location       TEXT,
    work_location       TEXT,
    blood_group         TEXT,
    long_term_diseases  TEXT DEFAULT '[]',
    identity_verified   INTEGER NOT NULL DEFAULT 0,
    aadhaar_number      TEXT DEFAULT '999988887777',
    aadhaar_last4       TEXT DEFAULT '7777',
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. family_members
CREATE TABLE IF NOT EXISTS family_members (
    id                  TEXT PRIMARY KEY,
    citizen_id          TEXT NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    age                 INTEGER,
    vulnerability_note  TEXT
);

-- 3. donors
CREATE TABLE IF NOT EXISTS donors (
    id                    TEXT PRIMARY KEY,
    type                  TEXT NOT NULL,
    name                  TEXT NOT NULL,
    contact               TEXT NOT NULL,
    age                   INTEGER,
    gender                TEXT,
    blood_group           TEXT,
    medical_conditions    TEXT,
    photo_url             TEXT,
    head_owner_name       TEXT,
    coordinator_name      TEXT,
    coordinator_contact   TEXT,
    org_location          TEXT,
    verification_ref      TEXT,
    verification_status   TEXT NOT NULL DEFAULT 'pending',
    created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. resources
CREATE TABLE IF NOT EXISTS resources (
    id           TEXT PRIMARY KEY,
    category     TEXT NOT NULL,
    subtype      TEXT,
    name         TEXT NOT NULL,
    quantity     REAL NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'available',
    location     TEXT NOT NULL,
    assigned_to  TEXT,
    source       TEXT DEFAULT 'government',
    capacity     REAL,
    occupancy    REAL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. ward_attributes
CREATE TABLE IF NOT EXISTS ward_attributes (
    ward_id                 TEXT PRIMARY KEY,
    name                    TEXT,
    sector                  TEXT,
    elevation_m             REAL,
    slope                   REAL,
    drainage_density        REAL,
    historical_flood_count  INTEGER DEFAULT 0
);

-- 6. ward_readings
CREATE TABLE IF NOT EXISTS ward_readings (
    id             TEXT PRIMARY KEY,
    ward_id        TEXT NOT NULL REFERENCES ward_attributes(ward_id) ON DELETE CASCADE,
    rainfall_mm    REAL,
    discharge_m3s  REAL,
    source         TEXT,
    fetched_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. risk_scores
CREATE TABLE IF NOT EXISTS risk_scores (
    id             TEXT PRIMARY KEY,
    ward_id        TEXT NOT NULL REFERENCES ward_attributes(ward_id) ON DELETE CASCADE,
    ward_name      TEXT,
    score          REAL NOT NULL,
    model_version  TEXT NOT NULL DEFAULT 'flood_twin_v2.1',
    run_type       TEXT NOT NULL DEFAULT 'sensor_live',
    scored_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. sos_reports
CREATE TABLE IF NOT EXISTS sos_reports (
    id                   TEXT PRIMARY KEY,
    report_id            TEXT,
    citizen_id           TEXT REFERENCES citizens(id) ON DELETE SET NULL,
    name                 TEXT NOT NULL,
    phone                TEXT,
    pax_count            INTEGER NOT NULL DEFAULT 1,
    medical_emergency    INTEGER NOT NULL DEFAULT 0,
    medical_condition    TEXT,
    includes_infants     INTEGER NOT NULL DEFAULT 0,
    includes_elderly     INTEGER NOT NULL DEFAULT 0,
    location             TEXT NOT NULL,
    lat                  REAL,
    lng                  REAL,
    landmark             TEXT,
    transmission_method  TEXT NOT NULL DEFAULT 'web',
    status               TEXT NOT NULL DEFAULT 'pending',
    ip_address           TEXT,
    browser_session_id   TEXT,
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. decision_snapshots
CREATE TABLE IF NOT EXISTS decision_snapshots (
    id                 TEXT PRIMARY KEY,
    incident_ref       TEXT,
    disaster_type      TEXT NOT NULL DEFAULT 'flood',
    priority_level     TEXT NOT NULL,
    injury_severity    TEXT NOT NULL,
    snapshot_data      TEXT DEFAULT '{}',
    procedure_id       TEXT,
    procedure_payload  TEXT DEFAULT '{}',
    ai_proposed_plan   TEXT,
    validation_result  TEXT DEFAULT '{}',
    status             TEXT NOT NULL DEFAULT 'proposed',
    reviewed_by        TEXT,
    reviewed_at        TEXT,
    rejection_reason   TEXT,
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. tickets (Central Audit Trail)
CREATE TABLE IF NOT EXISTS tickets (
    id             TEXT PRIMARY KEY,
    order_name     TEXT NOT NULL,
    type           TEXT NOT NULL,
    department     TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'open',
    issued_by      TEXT NOT NULL,
    executed_by    TEXT,
    source         TEXT,
    revert_reason  TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. ticket_inquiries
CREATE TABLE IF NOT EXISTS ticket_inquiries (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    response    TEXT,
    asked_by    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    answered_at TEXT
);

-- 12. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id         TEXT PRIMARY KEY,
    action     TEXT NOT NULL,
    user       TEXT,
    target     TEXT,
    status     TEXT DEFAULT 'Closed',
    timestamp  TEXT NOT NULL DEFAULT (datetime('now')),
    ip         TEXT,
    details    TEXT
);

-- 13. workforce_teams
CREATE TABLE IF NOT EXISTS workforce_teams (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT,
    status      TEXT NOT NULL,
    location    TEXT,
    sector      TEXT,
    phone       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. officers
CREATE TABLE IF NOT EXISTS officers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT,
    status      TEXT NOT NULL,
    location    TEXT,
    sector      TEXT,
    phone       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 15. workforce_assignments
CREATE TABLE IF NOT EXISTS workforce_assignments (
    id            TEXT PRIMARY KEY,
    team_id       TEXT NOT NULL,
    task_id       TEXT,
    status        TEXT NOT NULL DEFAULT 'assigned',
    assigned_at   TEXT NOT NULL DEFAULT (datetime('now')),
    last_checkin  TEXT,
    location      TEXT
);

-- 16. donations
CREATE TABLE IF NOT EXISTS donations (
    id                  TEXT PRIMARY KEY,
    donor_id            TEXT REFERENCES donors(id) ON DELETE CASCADE,
    donor_name          TEXT,
    type                TEXT NOT NULL,
    subtype             TEXT,
    quantity            REAL NOT NULL DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    matched_shelter_id  TEXT REFERENCES resources(id) ON DELETE SET NULL,
    status              TEXT NOT NULL DEFAULT 'submitted',
    availability_window TEXT,
    expiry_date         TEXT,
    prep_timestamp      TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 17. certificates
CREATE TABLE IF NOT EXISTS certificates (
    id                     TEXT PRIMARY KEY,
    donation_id            TEXT REFERENCES donations(id) ON DELETE SET NULL,
    donor_name             TEXT NOT NULL,
    contribution_summary   TEXT NOT NULL,
    qr_data                TEXT NOT NULL,
    issued_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. financial_donations
CREATE TABLE IF NOT EXISTS financial_donations (
    id              TEXT PRIMARY KEY,
    donor_id        TEXT REFERENCES donors(id) ON DELETE CASCADE,
    pan_number      TEXT NOT NULL,
    amount          REAL NOT NULL,
    payment_status  TEXT NOT NULL DEFAULT 'pending',
    certificate_id  TEXT REFERENCES certificates(id) ON DELETE SET NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

# Tables to clear in strict child-to-parent order (Step 1)
TABLE_DELETE_ORDER = [
    "certificates",
    "financial_donations",
    "donations",
    "workforce_assignments",
    "ticket_inquiries",
    "tickets",
    "audit_log",
    "decision_snapshots",
    "sos_reports",
    "risk_scores",
    "ward_readings",
    "ward_attributes",
    "workforce_teams",
    "officers",
    "resources",
    "donors",
    "family_members",
    "citizens",
]


def init_schema(conn: sqlite3.Connection) -> None:
    """Creates schema tables if they do not exist."""
    conn.executescript(INIT_SCHEMA_SQL)
    conn.commit()


def clear_database(conn: sqlite3.Connection) -> None:
    """
    Step 1: Wipe tables clean before seeding using DELETE FROM.
    DO NOT DROP TABLES. Just delete rows.
    Execution order (child to parent) respects Foreign Keys.
    """
    cursor = conn.cursor()
    for table_name in TABLE_DELETE_ORDER:
        cursor.execute(f"DELETE FROM {table_name};")
    conn.commit()
    print("🧹 Cleared tables...")


def seed_noise_data(conn: sqlite3.Connection) -> None:
    """
    Step 2: Inject Noise Data via raw SQL INSERT INTO statements.
    Sector 8 and Sector 2 ONLY. NEVER touches Sector 4 storyline.
    """
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    # 0. Noise Citizens (satisfies Aadhaar / National ID placeholder requirement: 999988887777)
    cursor.execute("""
        INSERT INTO citizens (id, browser_identifier, ble_peer_id, phone, name, age, gender, home_location, work_location, blood_group, long_term_diseases, identity_verified, aadhaar_number, aadhaar_last4, created_at)
        VALUES 
        ('CIT-NOISE-001', 'browser-noise-sec8', 'ble-peer-sec8', '+91-9820088001', 'Stranded Citizen (Sector 8)', 42, 'Male', 'Sector 8', 'Sector 8', 'B+', '[]', 1, '999988887777', '7777', datetime('now')),
        ('CIT-NOISE-002', 'browser-noise-sec2', 'ble-peer-sec2', '+91-9820022002', 'Commuter (Sector 2)', 29, 'Male', 'Sector 2', 'Sector 2', 'O+', '[]', 1, '999988887777', '7777', datetime('now'));
    """)

    # 1. Parent Wards (for Foreign Key integrity on risk_scores)
    cursor.execute("""
        INSERT INTO ward_attributes (ward_id, name, sector, elevation_m, slope, drainage_density, historical_flood_count)
        VALUES 
        ('ward-sector-8', 'Sector 8 Ward', 'Sector 8', 14.2, 0.02, 1.45, 1),
        ('ward-sector-2', 'Sector 2 Ward', 'Sector 2', 22.8, 0.05, 0.85, 0);
    """)

    # 2. risk_scores:
    #    - Sector 8 Ward: Medium risk (65/100)
    #    - Sector 2 Ward: Low risk (30/100)
    cursor.execute("""
        INSERT INTO risk_scores (id, ward_id, ward_name, score, model_version, run_type, scored_at)
        VALUES 
        ('99999999-9999-4999-8999-000000000008', 'ward-sector-8', 'Sector 8 Ward', 65, 'flood_twin_v2.1', 'sensor_live', datetime('now')),
        ('99999999-9999-4999-8999-000000000002', 'ward-sector-2', 'Sector 2 Ward', 30, 'flood_twin_v2.1', 'sensor_live', datetime('now'));
    """)

    # 3. resources:
    #    - Shelter: "Relief Camp - Sector 8" (Capacity: 100, Occupancy: 25)
    #    - Vehicle: "SDRF Boat 02" (Status: 'Available', Location: Sector 2)
    #    - Vehicle: "Medical Van B" (Status: 'Available')
    #    - Stock: "First Aid Kits" (Qty: 50, Location: Sector 8)
    cursor.execute("""
        INSERT INTO resources (id, category, subtype, name, quantity, status, location, capacity, occupancy, source, created_at, updated_at)
        VALUES
        ('77777777-7777-4777-8777-000000000101', 'shelter', 'Relief Camp', 'Relief Camp - Sector 8', 100, 'Available', 'Sector 8', 100, 25, 'government', datetime('now'), datetime('now')),
        ('77777777-7777-4777-8777-000000000102', 'vehicle', 'Rescue Boat', 'SDRF Boat 02', 1, 'Available', 'Sector 2', 8, 0, 'government', datetime('now'), datetime('now')),
        ('77777777-7777-4777-8777-000000000103', 'vehicle', 'Medical Van', 'Medical Van B', 1, 'Available', 'Sector 2', 4, 0, 'government', datetime('now'), datetime('now')),
        ('77777777-7777-4777-8777-000000000104', 'stock', 'Medical Supplies', 'First Aid Kits', 50, 'Available', 'Sector 8', 50, 0, 'government', datetime('now'), datetime('now')),
        -- Workforce personnel units also represented in resources for cross-service queries
        ('77777777-7777-4777-8777-000000000105', 'personnel', 'Rescue Unit', 'SDRF Unit B', 6, 'Standby', 'Sector 2', 6, 0, 'government', datetime('now'), datetime('now')),
        ('77777777-7777-4777-8777-000000000106', 'personnel', 'Response Unit', 'NDRF Unit 2', 8, 'Off-Duty', 'Sector 2', 8, 0, 'government', datetime('now'), datetime('now'));
    """)

    # 4. sos_reports:
    #    - Noise 1: 4 people, no medical emergency, "Stranded on low roof", Sector 8 (Medium severity)
    #    - Noise 2: 1 person, no medical emergency, "Waterlogging in street", Sector 2 (Low severity)
    cursor.execute("""
        INSERT INTO sos_reports (
            id, report_id, citizen_id, name, phone, pax_count, medical_emergency, medical_condition,
            includes_infants, includes_elderly, location, lat, lng, landmark,
            transmission_method, status, created_at, updated_at
        ) VALUES 
        (
            '22222222-2222-4222-8222-000000000001',
            'SOS-SEC8-801',
            'CIT-NOISE-001',
            'Stranded Family (Sector 8)',
            '+91-9820088001',
            4,
            0,
            'None',
            0,
            0,
            'Sector 8',
            18.9750,
            73.1350,
            'Stranded on low roof',
            'web',
            'Medium',
            datetime('now'),
            datetime('now')
        ),
        (
            '22222222-2222-4222-8222-000000000002',
            'SOS-SEC2-202',
            'CIT-NOISE-002',
            'Commuter (Sector 2)',
            '+91-9820022002',
            1,
            0,
            'None',
            0,
            0,
            'Sector 2',
            18.9910,
            73.1120,
            'Waterlogging in street',
            'ivr',
            'Low',
            datetime('now'),
            datetime('now')
        );
    """)

    # 5. workforce_teams & officers:
    #    - SDRF Unit B: Status 'Standby', Location Sector 2
    #    - NDRF Unit 2: Status 'Off-Duty'
    cursor.execute("""
        INSERT INTO workforce_teams (id, name, role, status, location, sector, phone, created_at)
        VALUES 
        ('w-team-sdrf-b', 'SDRF Unit B', 'Swift Water Evacuation', 'Standby', 'Sector 2', 'Sector 2', '+91 98201 10002', datetime('now')),
        ('w-team-ndrf-2', 'NDRF Unit 2', 'Disaster Search & Rescue', 'Off-Duty', 'Sector 2 Base', 'Sector 2', '+91 98201 10003', datetime('now'));
    """)

    cursor.execute("""
        INSERT INTO officers (id, name, role, status, location, sector, phone, created_at)
        VALUES 
        ('OFF-SDRF-B', 'SDRF Unit B (Lead: Sub-Insp. Deshmukh)', 'Swift Water Rescue Lead', 'Standby', 'Sector 2', 'Sector 2', '+91 98201 10002', datetime('now')),
        ('OFF-NDRF-2', 'NDRF Unit 2 (Lead: Insp. K. Patil)', 'Heavy Response Lead', 'Off-Duty', 'Sector 2 Base', 'Sector 2', '+91 98201 10003', datetime('now'));
    """)

    # 6. audit_log / tickets:
    #    - Log 1: "Cleared fallen tree at Sector 2 main road" (Status: 'Closed')
    #    - Log 2: "Delivered 20 water rations to Sector 8 camp" (Status: 'Closed')
    cursor.execute("""
        INSERT INTO tickets (id, order_name, type, department, status, issued_by, executed_by, source, created_at, updated_at)
        VALUES 
        ('t1111111-1111-4111-8111-000000000001', 'Cleared fallen tree at Sector 2 main road', 'road_clearance', 'Public Works / Sector 2', 'Closed', 'DEOC Controller', 'Sector 2 Road Crew', 'audit_log', datetime('now'), datetime('now')),
        ('t1111111-1111-4111-8111-000000000002', 'Delivered 20 water rations to Sector 8 camp', 'relief_supply', 'Logistics Operations', 'Closed', 'Logistics Officer', 'SDRF Transport B', 'audit_log', datetime('now'), datetime('now'));
    """)

    cursor.execute("""
        INSERT INTO audit_log (id, action, user, target, status, timestamp, ip, details)
        VALUES 
        ('LOG-SEC2-001', 'Cleared fallen tree at Sector 2 main road', 'Field Officer (Sector 2)', 'Sector 2 main road', 'Closed', datetime('now'), '192.168.1.52', '{"sector": "Sector 2", "cleared": true}'),
        ('LOG-SEC8-002', 'Delivered 20 water rations to Sector 8 camp', 'Logistics Officer (Sector 8)', 'Relief Camp - Sector 8', 'Closed', datetime('now'), '192.168.1.88', '{"sector": "Sector 8", "units": 20, "delivered": true}');
    """)

    conn.commit()
    print("🌱 Seeded Noise Data...")


def sync_sos_service_db() -> None:
    """
    Synchronizes noise SOS reports to backend/services/sos_service/sos.db
    if that service SQLite database exists, ensuring the active FastAPI server
    reflects the same background noise data.
    """
    if not SOS_SERVICE_DB_PATH.exists():
        return

    try:
        conn = sqlite3.connect(SOS_SERVICE_DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Wipe existing reports
        cursor.execute("DELETE FROM sos_reports;")

        # Insert the 2 noise SOS reports (No Sector 4 data!)
        cursor.execute("""
            INSERT INTO sos_reports (
                report_id, citizen_id, name, phone, pax_count,
                medical_emergency, medical_condition, includes_infants,
                includes_elderly, lat, lng, landmark, status
            ) VALUES 
            ('SOS-SEC8-801', 'CIT-NOISE-001', 'Stranded Family (Sector 8)', '+91-9820088001', 4, 0, 'None', 0, 0, 18.9750, 73.1350, 'Stranded on low roof', 'medium'),
            ('SOS-SEC2-202', 'CIT-NOISE-002', 'Commuter (Sector 2)', '+91-9820022002', 1, 0, 'None', 0, 0, 18.9910, 73.1120, 'Waterlogging in street', 'low');
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Note] Companion sos.db sync note: {e}")


def main() -> None:
    """Main entrypoint for database reset and noise seeding."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")

    try:
        # Step 0: Ensure schema exists
        init_schema(conn)

        # Step 1: Wipe tables clean (child to parent)
        clear_database(conn)

        # Step 2: Inject Noise Data
        seed_noise_data(conn)

        # Companion sync to sos_service DB if present
        sync_sos_service_db()

        print("✅ Ready for live demo.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
