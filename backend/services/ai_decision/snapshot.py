"""
AI Decision System - Snapshot Module
Fetches real-time incident and environmental state, creates an immutable
snapshot JSON, and inserts a proposed record into `decision_snapshots`.

STRICT RULES:
- Read-only from: sos_reports, twin_state, resources, workforce_assignments, risk_scores
- Write-to: decision_snapshots
- Pure snapshot creation only (NO AI calls, NO validation logic)
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from shared.supabase import get_async_supabase_client

logger = logging.getLogger(__name__)


def _normalize_priority(raw_priority: Any) -> str:
    """Normalize priority value to 'high', 'medium', or 'low'."""
    if not raw_priority:
        return "medium"
    val = str(raw_priority).strip().lower()
    if val in ("critical", "extreme", "high", "4", "3"):
        return "high"
    if val in ("medium", "moderate", "2"):
        return "medium"
    if val in ("low", "1"):
        return "low"
    return "medium"


def _normalize_injury_severity(raw_injury: Any) -> str:
    """Normalize injury severity to 'critical', 'moderate', or 'none'."""
    if not raw_injury:
        return "none"
    val = str(raw_injury).strip().lower()
    if "critical" in val or "severe" in val or "high" in val:
        return "critical"
    if "moderate" in val or "minor" in val or "medium" in val or "first_aid" in val:
        return "moderate"
    return "none"


async def fetch_incident(client: Any, incident_ref: str) -> Dict[str, Any]:
    """
    Fetch the incident record from `sos_reports`.
    Falls back to `twin_state` if not found in `sos_reports`.
    """
    try:
        res = await client.table("sos_reports").select("*").eq("id", incident_ref).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        logger.warning(f"Could not query sos_reports for incident {incident_ref}: {e}")

    try:
        res = await client.table("twin_state").select("*").eq("id", incident_ref).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        logger.warning(f"Could not query twin_state for incident {incident_ref}: {e}")

    return {"id": incident_ref, "status": "active", "symbol": "sos"}


async def fetch_resources(client: Any) -> List[Dict[str, Any]]:
    """
    Fetch active available resources from `resources` table.
    """
    try:
        res = await client.table("resources").select("*").eq("status", "available").execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Could not query resources table: {e}")
        return []


async def fetch_workforce_assignments(client: Any) -> List[Dict[str, Any]]:
    """
    Fetch current workforce assignments from `workforce_assignments` table.
    """
    try:
        res = await client.table("workforce_assignments").select("*").execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Could not query workforce_assignments table: {e}")
        return []


async def fetch_risk_scores(client: Any) -> List[Dict[str, Any]]:
    """
    Fetch latest flood risk scores from `risk_scores` table.
    """
    try:
        res = await client.table("risk_scores").select("*").execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Could not query risk_scores table: {e}")
        return []


async def create_decision_snapshot(
    incident_ref: Union[str, UUID],
    disaster_type: str = "flood",
    priority_level: Optional[str] = None,
    injury_severity: Optional[str] = None,
    override_incident_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Step 1-3 of the AI Decision Pipeline:
    1. Fetch incident data, nearby resources, workforce, and risk score.
    2. Freeze state into an immutable snapshot JSON structure.
    3. Insert a record into `decision_snapshots` with status 'proposed'.

    Returns the inserted snapshot record dictionary.
    """
    client = await get_async_supabase_client()
    incident_id_str = str(incident_ref)

    # 1. Fetch data concurrently
    if override_incident_data:
        incident_data = override_incident_data
        resources_task = fetch_resources(client)
        workforce_task = fetch_workforce_assignments(client)
        risk_task = fetch_risk_scores(client)
        resources, workforce, risk_scores = await asyncio.gather(
            resources_task, workforce_task, risk_task
        )
    else:
        incident_task = fetch_incident(client, incident_id_str)
        resources_task = fetch_resources(client)
        workforce_task = fetch_workforce_assignments(client)
        risk_task = fetch_risk_scores(client)
        incident_data, resources, workforce, risk_scores = await asyncio.gather(
            incident_task, resources_task, workforce_task, risk_task
        )

    # Extract & normalize classification attributes
    derived_priority = priority_level or _normalize_priority(
        incident_data.get("priority_level")
        or incident_data.get("priority")
        or incident_data.get("severity")
        or incident_data.get("severity_count")
    )
    derived_injury = injury_severity or _normalize_injury_severity(
        incident_data.get("injury_severity")
        or incident_data.get("injury")
        or incident_data.get("medical_status")
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    snapshot_id = str(uuid.uuid4())

    # 2. Freeze into immutable snapshot JSON structure
    snapshot_data = {
        "captured_at": now_iso,
        "incident": incident_data,
        "resources": resources,
        "workforce": workforce,
        "risk_scores": risk_scores,
    }

    # 3. Prepare decision_snapshots record
    decision_snapshot_record = {
        "id": snapshot_id,
        "incident_ref": incident_id_str,
        "disaster_type": disaster_type,
        "priority_level": derived_priority,
        "injury_severity": derived_injury,
        "snapshot_data": snapshot_data,
        "procedure_id": None,
        "procedure_payload": {},
        "ai_proposed_plan": None,
        "validation_result": {},
        "status": "proposed",
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    # Insert into decision_snapshots table in Supabase
    try:
        res = await client.table("decision_snapshots").insert(decision_snapshot_record).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        logger.error(f"Failed to insert into decision_snapshots: {e}")
        # Return the in-memory record so pipeline caller can still inspect/test
        return decision_snapshot_record

    return decision_snapshot_record
