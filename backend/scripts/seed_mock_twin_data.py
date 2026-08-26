"""
Seed Script for Digital Twin Mock Data.
Populates 12 diverse incident command & resource records directly into `twin_state`
for testing the Panvel disaster scenario on the Digital Twin Map.

Schema (twin_state):
  id            UUID
  entity_type   TEXT   ('sos_report' | 'resource_unit' | 'infrastructure')
  location      GEOGRAPHY(POINT, 4326) -> PostGIS EWKT format: 'SRID=4326;POINT(lng lat)'
  symbol        TEXT   ('sos', 'medical', 'shelter', 'boat', 'truck', 'broken_building', 'triangle_alert')
  severity_count INT
  status        TEXT
  last_updated  TIMESTAMPTZ
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Walk up to the root directory or backend directory to find the .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from shared.supabase import get_async_supabase_client


async def seed_mock_twin_data():
    client = await get_async_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    # Clear existing mock data first for a clean state
    print("Clearing existing records in 'twin_state'...")
    try:
        await client.table("twin_state").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("  -> Cleaned existing records.")
    except Exception as e:
        print(f"  -> Warning while clearing: {e}")

    # 12 diverse disaster scenario records distributed across Panvel (Lng: 73.10 - 73.13, Lat: 18.98 - 19.01)
    twin_state_records = [
        # 1. 4x SOS Reports (severity_count from 2 to 45 for size scaling test)
        {
            "id": str(uuid.uuid4()),
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1166 18.9894)",
            "symbol": "sos",
            "severity_count": 2,
            "status": "active",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1235 18.9962)",
            "symbol": "sos",
            "severity_count": 8,
            "status": "active",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1072 18.9845)",
            "symbol": "sos",
            "severity_count": 22,
            "status": "critical",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "sos_report",
            "location": "SRID=4326;POINT(73.1190 19.0065)",
            "symbol": "sos",
            "severity_count": 45,
            "status": "critical",
            "last_updated": now_iso,
        },

        # 2. 2x Medical Units (green square with "+" icon)
        {
            "id": str(uuid.uuid4()),
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1120 18.9910)",
            "symbol": "medical",
            "severity_count": 4,
            "status": "available",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1275 18.9995)",
            "symbol": "medical",
            "severity_count": 2,
            "status": "busy",
            "last_updated": now_iso,
        },

        # 3. 2x Shelters (relief camps, occupancy capacity 80 & 150)
        {
            "id": str(uuid.uuid4()),
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1045 18.9930)",
            "symbol": "shelter",
            "severity_count": 80,
            "status": "open",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1150 19.0080)",
            "symbol": "shelter",
            "severity_count": 150,
            "status": "open",
            "last_updated": now_iso,
        },

        # 4. 2x Rescue Vehicles (boat & truck)
        {
            "id": str(uuid.uuid4()),
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1018 19.0020)",
            "symbol": "boat",
            "severity_count": 5,
            "status": "deployed",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "resource_unit",
            "location": "SRID=4326;POINT(73.1250 18.9860)",
            "symbol": "truck",
            "severity_count": 3,
            "status": "available",
            "last_updated": now_iso,
        },

        # 5. 2x Infrastructure Damage (amber triangle / critical status)
        {
            "id": str(uuid.uuid4()),
            "entity_type": "infrastructure",
            "location": "SRID=4326;POINT(73.1110 18.9980)",
            "symbol": "broken_building",
            "severity_count": 1,
            "status": "critical",
            "last_updated": now_iso,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_type": "infrastructure",
            "location": "SRID=4326;POINT(73.1280 18.9915)",
            "symbol": "triangle_alert",
            "severity_count": 1,
            "status": "critical",
            "last_updated": now_iso,
        },
    ]

    print(f"Inserting {len(twin_state_records)} mock disaster records into 'twin_state' table...")
    response = await client.table("twin_state").insert(twin_state_records).execute()

    if response.data:
        print(f"\n[OK] Successfully inserted {len(response.data)} records into twin_state!")
        for rec in response.data:
            print(f"  - [{rec['entity_type']}] symbol={rec['symbol']} | status={rec['status']} | severity_count={rec['severity_count']} | id={rec['id']}")
    else:
        print(f"\n[ERROR] Insert returned no data. Full response: {response}")


if __name__ == "__main__":
    asyncio.run(seed_mock_twin_data())
