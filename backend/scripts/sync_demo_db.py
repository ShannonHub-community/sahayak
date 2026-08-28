"""
Sahayak - Demo Database Sync Script
Synchronizes Supabase database tables (`twin_state`, `sos_reports`, `resources`,
`workforce_assignments`, `risk_scores`) with the exact disaster telemetry
and markers displayed on the React Digital Twin map and AI Command Center.

Usage:
  backend\\.venv\\Scripts\\python.exe backend\\scripts\\sync_demo_db.py
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or backend
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent
load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=backend_dir / ".env")

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from shared.supabase import get_async_supabase_client


async def clear_table(client, table_name: str):
    """Safely delete all records from a Supabase table."""
    try:
        await client.table(table_name).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"  [OK] Cleaned table '{table_name}'.")
    except Exception as e:
        print(f"  [INFO] Note on cleaning table '{table_name}': {e}")


async def sync_demo_database():
    client = await get_async_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    print("================================================================")
    print("      SAHAYAK DEMO DATABASE SYNCHRONIZATION                    ")
    print("================================================================")

    # 1. Clear existing tables
    print("\n1. Clearing existing records from demo tables...")
    await clear_table(client, "workforce_assignments")  # clear child first to respect FK
    await clear_table(client, "twin_state")
    await clear_table(client, "sos_reports")
    await clear_table(client, "resources")
    await clear_table(client, "risk_scores")

    # 2. Insert Digital Twin Map Markers (`twin_state`)
    # Matches the exact coordinates and points on DigitalTwinMap.tsx
    print("\n2. Inserting Digital Twin state records into 'twin_state'...")
    twin_state_records = [
        # --- Flood Observation Points (matching MOCK_FLOOD_POINTS) ---
        {
            "id": "11111111-1111-1111-1111-111111111101",
            "entity_type": "flood_zone",
            "location": "SRID=4326;POINT(73.1090 18.9950)",
            "symbol": "triangle_alert",
            "severity_count": 42,  # 4.2m depth (Kalundre Riverbank)
            "status": "critical",
            "last_updated": now_iso,
        },
        {
            "id": "11111111-1111-1111-1111-111111111102",
            "entity_type": "flood_zone",
            "location": "SRID=4326;POINT(73.1160 18.9890)",
            "symbol": "triangle_alert",
            "severity_count": 26,  # 2.6m depth (Market Yard Lowlands)
            "status": "active",
            "last_updated": now_iso,
        },
        {
            "id": "11111111-1111-1111-1111-111111111103",
            "entity_type": "flood_zone",
            "location": "SRID=4326;POINT(73.1250 18.9820)",
            "symbol": "triangle_alert",
            "severity_count": 35,  # 3.5m depth (Gadhi River Confluence)
            "status": "critical",
            "last_updated": now_iso,
        },
        {
            "id": "11111111-1111-1111-1111-111111111104",
            "entity_type": "flood_zone",
            "location": "SRID=4326;POINT(73.1210 19.0040)",
            "symbol": "triangle_alert",
            "severity_count": 18,  # 1.8m depth (Takka Colony Spillway)
            "status": "active",
            "last_updated": now_iso,
        },

        # --- SOS Reports (Active Incidents in Panvel) ---
        {
            "id": "22222222-2222-2222-2222-222222222201",
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1166 18.9894)",
            "symbol": "sos",
            "severity_count": 15,
            "status": "critical",
            "last_updated": now_iso,
        },
        {
            "id": "22222222-2222-2222-2222-222222222202",
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1235 18.9962)",
            "symbol": "sos",
            "severity_count": 8,
            "status": "active",
            "last_updated": now_iso,
        },
        {
            "id": "22222222-2222-2222-2222-222222222203",
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1072 18.9845)",
            "symbol": "sos",
            "severity_count": 22,
            "status": "critical",
            "last_updated": now_iso,
        },
        {
            "id": "22222222-2222-2222-2222-222222222204",
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1190 19.0065)",
            "symbol": "sos",
            "severity_count": 45,
            "status": "critical",
            "last_updated": now_iso,
        },

        # --- Medical & Resource Units ---
        {
            "id": "33333333-3333-3333-3333-333333333301",
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "symbol": "medical",
            "severity_count": 4,
            "status": "available",
            "last_updated": now_iso,
        },
        {
            "id": "33333333-3333-3333-3333-333333333302",
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1275 18.9995)",
            "symbol": "medical",
            "severity_count": 2,
            "status": "busy",
            "last_updated": now_iso,
        },

        # --- Shelters ---
        {
            "id": "44444444-4444-4444-4444-444444444401",
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1045 18.9930)",
            "symbol": "shelter",
            "severity_count": 80,
            "status": "open",
            "last_updated": now_iso,
        },
        {
            "id": "44444444-4444-4444-4444-444444444402",
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1150 19.0080)",
            "symbol": "shelter",
            "severity_count": 150,
            "status": "open",
            "last_updated": now_iso,
        },

        # --- Vehicles (Boats & Trucks) ---
        {
            "id": "55555555-5555-5555-5555-555555555501",
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1018 19.0020)",
            "symbol": "boat",
            "severity_count": 5,
            "status": "deployed",
            "last_updated": now_iso,
        },
        {
            "id": "55555555-5555-5555-5555-555555555502",
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1250 18.9860)",
            "symbol": "truck",
            "severity_count": 3,
            "status": "available",
            "last_updated": now_iso,
        },

        # --- Infrastructure Alerts ---
        {
            "id": "66666666-6666-6666-6666-666666666601",
            "entity_type": "infrastructure",
            "location": "SRID=4326;POINT(73.1110 18.9980)",
            "symbol": "broken_building",
            "severity_count": 1,
            "status": "critical",
            "last_updated": now_iso,
        },
    ]

    try:
        res = await client.table("twin_state").insert(twin_state_records).execute()
        print(f"  [OK] Successfully inserted {len(res.data or twin_state_records)} records into 'twin_state'.")
    except Exception as e:
        print(f"  [ERROR] Failed inserting to 'twin_state': {e}")

    # 3. Insert SOS Reports (`sos_reports`)
    print("\n3. Inserting SOS reports into 'sos_reports'...")
    sos_records = [
        {
            "id": "22222222-2222-2222-2222-222222222201",
            "name": "Ward 1 Stranded Residents Group",
            "phone": "+91-9820011223",
            "pax_count": 15,
            "medical_emergency": True,
            "includes_infants": True,
            "includes_elderly": True,
            "location": "SRID=4326;POINT(73.1166 18.9894)",
            "landmark": "Near Kalundre Riverbank, Ward 1 Old Panvel",
            "transmission_method": "web",
            "status": "critical",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "22222222-2222-2222-2222-222222222202",
            "name": "Line Ali Senior Citizens",
            "phone": "+91-9820044556",
            "pax_count": 8,
            "medical_emergency": False,
            "includes_infants": False,
            "includes_elderly": True,
            "location": "SRID=4326;POINT(73.1235 18.9962)",
            "landmark": "Line Ali ground floor bungalow, Ward 2",
            "transmission_method": "web",
            "status": "active",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "22222222-2222-2222-2222-222222222203",
            "name": "Market Yard Commercial Enclave",
            "phone": "+91-9820077889",
            "pax_count": 22,
            "medical_emergency": True,
            "includes_infants": False,
            "includes_elderly": False,
            "location": "SRID=4326;POINT(73.1072 18.9845)",
            "landmark": "Panvel Market Yard Lowlands, Sector 4",
            "transmission_method": "web",
            "status": "critical",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    try:
        res = await client.table("sos_reports").insert(sos_records).execute()
        print(f"  [OK] Successfully inserted {len(res.data or sos_records)} records into 'sos_reports'.")
    except Exception as e:
        print(f"  [INFO] Note on inserting into 'sos_reports': {e}")

    # 4. Insert Resources (`resources`)
    print("\n4. Inserting inventory resources into 'resources'...")
    resource_records = [
        # Equipment & Supplies
        {
            "id": "77777777-7777-7777-7777-777777777701",
            "name": "Inflatable Rescue Boat Type A",
            "category": "vehicle",
            "subtype": "Rescue Boat",
            "quantity": 4,
            "capacity": 5,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "77777777-7777-7777-7777-777777777702",
            "name": "Medical Kit Type B",
            "category": "medical_equipment",
            "subtype": "First Aid Kit",
            "quantity": 18,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "77777777-7777-7777-7777-777777777703",
            "name": "Drinking Water & Rations",
            "category": "ration",
            "subtype": "Drinking Water",
            "quantity": 120,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "77777777-7777-7777-7777-777777777704",
            "name": "Heavy Rescue Stretcher Gear",
            "category": "medical_equipment",
            "subtype": "Stretcher",
            "quantity": 8,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        # Personnel Workforce Units
        {
            "id": "77777777-7777-7777-7777-777777777705",
            "name": "NDRF Unit 1 (Boat Active - 5 Members)",
            "category": "personnel",
            "subtype": "Rescue/Boat Operator",
            "quantity": 5,
            "capacity": 5,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1018 19.0020)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "77777777-7777-7777-7777-777777777706",
            "name": "NDRF Unit 3 (Panvel North Station)",
            "category": "personnel",
            "subtype": "Medic",
            "quantity": 4,
            "capacity": 4,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "77777777-7777-7777-7777-777777777707",
            "name": "SDRF Team 2 (Heavy Response)",
            "category": "personnel",
            "subtype": "Rescue/Boat Operator",
            "quantity": 6,
            "capacity": 6,
            "status": "available",
            "source": "government",
            "location": "SRID=4326;POINT(73.1250 18.9860)",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    try:
        res = await client.table("resources").insert(resource_records).execute()
        print(f"  [OK] Successfully inserted {len(res.data or resource_records)} records into 'resources'.")
    except Exception as e:
        print(f"  [INFO] Note on inserting into 'resources': {e}")

    # 5. Insert Workforce Assignments (`workforce_assignments`)
    print("\n5. Inserting workforce assignments into 'workforce_assignments'...")
    workforce_records = [
        {
            "id": "88888888-8888-8888-8888-888888888801",
            "team_id": "77777777-7777-7777-7777-777777777705",
            "task_id": "22222222-2222-2222-2222-222222222201",
            "status": "available",
            "location": "SRID=4326;POINT(73.1018 19.0020)",
            "assigned_at": now_iso,
        },
        {
            "id": "88888888-8888-8888-8888-888888888802",
            "team_id": "77777777-7777-7777-7777-777777777706",
            "task_id": "22222222-2222-2222-2222-222222222202",
            "status": "available",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "assigned_at": now_iso,
        },
        {
            "id": "88888888-8888-8888-8888-888888888803",
            "team_id": "77777777-7777-7777-7777-777777777707",
            "task_id": "22222222-2222-2222-2222-222222222203",
            "status": "available",
            "location": "SRID=4326;POINT(73.1250 18.9860)",
            "assigned_at": now_iso,
        },
    ]

    try:
        res = await client.table("workforce_assignments").insert(workforce_records).execute()
        print(f"  [OK] Successfully inserted {len(res.data or workforce_records)} records into 'workforce_assignments'.")
    except Exception as e:
        print(f"  [INFO] Note on inserting into 'workforce_assignments': {e}")

    # 6. Insert Risk Scores (`risk_scores`)
    print("\n6. Inserting flood risk scores into 'risk_scores'...")
    risk_records = [
        {
            "id": "99999999-9999-9999-9999-999999999901",
            "ward_id": "157b9f4e-f04b-469c-aeaf-c36469975bca",
            "score": 94,
            "model_version": "flood_twin_v2.1",
            "run_type": "sensor_live",
            "scored_at": now_iso,
        },
    ]

    try:
        res = await client.table("risk_scores").insert(risk_records).execute()
        print(f"  [OK] Successfully inserted {len(res.data or risk_records)} records into 'risk_scores'.")
    except Exception as e:
        print(f"  [INFO] Note on inserting into 'risk_scores': {e}")

    print("\n================================================================")
    print("      DATABASE SYNCHRONIZATION COMPLETE!                        ")
    print("================================================================")


if __name__ == "__main__":
    asyncio.run(sync_demo_database())
