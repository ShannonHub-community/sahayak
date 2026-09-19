"""
AI Decision System - Staleness Module (Step 7 of Pipeline)
Compares frozen snapshot state against live database state to classify staleness:
- Level 1: No change (identical priority/injury and exact resource stock/status)
- Level 2: Minor numeric change (incident unchanged, resource stock shifted but live stock >= requested)
- Level 3: Major change (incident escalated, resource unavailable, or live stock < requested)

STRICT RULES:
- Pure deterministic Python (NO AI calls, NO randomness).
- Transitions snapshot status to 'stale' on Level 3.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from uuid import UUID

from shared.supabase import get_async_supabase_client

logger = logging.getLogger(__name__)

# Severity rankings for deterministic comparison
_PRIORITY_RANK = {"low": 1, "medium": 2, "high": 3}
_INJURY_RANK = {"none": 0, "moderate": 1, "critical": 2}


def _normalize_priority(raw: Any) -> str:
    if not raw:
        return "medium"
    val = str(raw).strip().lower()
    if val in ("critical", "extreme", "high", "4", "3"):
        return "high"
    if val in ("medium", "moderate", "2"):
        return "medium"
    if val in ("low", "1"):
        return "low"
    return "medium"


def _normalize_injury(raw: Any) -> str:
    if not raw:
        return "none"
    val = str(raw).strip().lower()
    if "critical" in val or "severe" in val or "high" in val:
        return "critical"
    if "moderate" in val or "minor" in val or "medium" in val or "first_aid" in val:
        return "moderate"
    return "none"


async def fetch_live_incident(client: Any, incident_ref: str) -> Dict[str, Any]:
    """Fetch current state of the incident from sos_reports or twin_state."""
    try:
        res = await client.table("sos_reports").select("*").eq("id", incident_ref).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        logger.warning(f"Could not query live sos_reports for {incident_ref}: {e}")

    try:
        res = await client.table("twin_state").select("*").eq("id", incident_ref).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        logger.warning(f"Could not query live twin_state for {incident_ref}: {e}")

    return {}


async def fetch_live_resources(client: Any, resource_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Fetch current state of specified resources from resources table."""
    if not resource_ids:
        return {}
    try:
        res = await client.table("resources").select("*").in_("id", resource_ids).execute()
        return {str(r["id"]): r for r in (res.data or []) if "id" in r}
    except Exception as e:
        logger.warning(f"Could not query live resources for IDs {resource_ids}: {e}")
        return {}


def _extract_plan_resources(ai_proposed_plan: Any) -> List[Dict[str, Any]]:
    """
    Extracts allocated resources from either the new nested schema:
    ai_proposed_plan["recommendation"]["allocated_resources"]
    or falls back to legacy flat schema:
    ai_proposed_plan["recommended_resources"]
    """
    if not isinstance(ai_proposed_plan, dict):
        return []

    # Check new nested schema first
    rec = ai_proposed_plan.get("recommendation")
    if isinstance(rec, dict) and isinstance(rec.get("allocated_resources"), list):
        return rec["allocated_resources"]

    # Fallback to legacy schema
    flat = ai_proposed_plan.get("recommended_resources")
    if isinstance(flat, list):
        return flat

    return []


def evaluate_diff(
    snapshot_row: Dict[str, Any],
    live_incident: Dict[str, Any],
    live_resources: Dict[str, Dict[str, Any]],
) -> Tuple[int, str]:
    """
    Deterministic diff engine classifying staleness into Level 1, 2, or 3.

    Returns:
        Tuple[int, str]: (staleness_level, reason_description)
    """
    snapshot_data = snapshot_row.get("snapshot_data") or {}
    ai_proposed_plan = snapshot_row.get("ai_proposed_plan") or {}
    snap_priority = _normalize_priority(snapshot_row.get("priority_level"))
    snap_injury = _normalize_injury(snapshot_row.get("injury_severity"))

    # 1. Incident Escalation / Modification Check
    if live_incident:
        live_priority = _normalize_priority(
            live_incident.get("priority_level")
            or live_incident.get("priority")
            or live_incident.get("severity")
            or live_incident.get("severity_count")
        )
        live_injury = _normalize_injury(
            live_incident.get("injury_severity")
            or live_incident.get("injury")
            or live_incident.get("medical_status")
        )

        live_status = str(live_incident.get("status", "")).lower()
        if live_status in ("resolved", "closed", "cancelled"):
            return 3, f"Incident has been marked '{live_status}' in live system."

        if live_priority != snap_priority or live_injury != snap_injury:
            return 3, (
                f"Incident classification changed: Priority '{snap_priority}' -> '{live_priority}', "
                f"Injury '{snap_injury}' -> '{live_injury}'."
            )

    # 2. Resource Availability and Stock Level Check
    resources = _extract_plan_resources(ai_proposed_plan)

    # Map snapshot resources for comparison
    snap_resources_list = snapshot_data.get("resources") or snapshot_data.get("available_resources") or []
    snap_resource_map = {str(r["id"]): r for r in snap_resources_list if isinstance(r, dict) and "id" in r}

    has_numeric_drift = False
    drift_reasons: List[str] = []

    # Aggregate requested quantities per resource_id
    requested_quantities: Dict[str, int] = {}
    for item in resources:
        if isinstance(item, dict):
            res_id = str(item.get("item_id") or item.get("resource_id") or "").strip()
            qty = item.get("quantity", 0)
            if res_id and isinstance(qty, (int, float)) and qty > 0:
                requested_quantities[res_id] = requested_quantities.get(res_id, 0) + int(qty)

    for res_id, req_qty in requested_quantities.items():
        if res_id not in live_resources:
            return 3, f"Recommended resource ID '{res_id}' no longer exists in live database."

        live_rec = live_resources[res_id]
        live_status = str(live_rec.get("status", "")).lower()
        live_stock = int(live_rec.get("quantity", 0))
        res_name = live_rec.get("name", res_id)

        # Hard failure condition: Resource is no longer available
        if live_status != "available":
            return 3, f"Resource '{res_name}' (ID: {res_id}) status changed to '{live_status}' (must be 'available')."

        # Hard failure condition: Live stock dropped below requested plan allocation
        if live_stock < req_qty:
            return 3, (
                f"Resource '{res_name}' live stock ({live_stock}) is insufficient for requested plan quantity ({req_qty})."
            )

        # Check for numeric drift against frozen snapshot stock
        snap_rec = snap_resource_map.get(res_id)
        if snap_rec:
            snap_stock = int(snap_rec.get("quantity", live_stock))
            if live_stock != snap_stock:
                has_numeric_drift = True
                drift_reasons.append(
                    f"Resource '{res_name}' stock shifted from {snap_stock} to {live_stock} (plan requires {req_qty})"
                )

    # 3. Classify Level 2 vs Level 1
    if has_numeric_drift:
        reason_text = "Minor stock changes detected; plan remains fully fulfillable: " + "; ".join(drift_reasons)
        return 2, reason_text

    return 1, "Live state matches snapshot perfectly with zero detectable drift."


# ---------------------------------------------------------------------------
# Public Entry Point
# ---------------------------------------------------------------------------

async def check_staleness(snapshot_id: Union[str, UUID]) -> Dict[str, Any]:
    """
    Step 7 of the AI Decision Pipeline:
    1. Fetches snapshot data, plan, and incident reference from decision_snapshots.
    2. Queries live tables (sos_reports/twin_state and resources) for current state.
    3. Runs deterministic diff engine to classify staleness into Level 1, 2, or 3.
    4. If Level 3: updates snapshot status to 'stale'.
    5. Returns staleness dictionary: {"staleness_level": 1|2|3, "reason": str}.

    Raises:
        ValueError: If snapshot is not found.
    """
    client = await get_async_supabase_client()
    snapshot_id_str = str(snapshot_id)

    # 1. Query decision_snapshots
    snap_res = (
        await client.table("decision_snapshots")
        .select("id, incident_ref, priority_level, injury_severity, snapshot_data, ai_proposed_plan, status")
        .eq("id", snapshot_id_str)
        .execute()
    )
    if not snap_res.data or len(snap_res.data) == 0:
        raise ValueError(f"Decision snapshot '{snapshot_id_str}' not found.")

    snapshot_row = snap_res.data[0]
    incident_ref = str(snapshot_row.get("incident_ref", ""))
    ai_proposed_plan = snapshot_row.get("ai_proposed_plan") or {}

    # Extract required resource IDs from plan
    resource_ids: List[str] = []
    resources = _extract_plan_resources(ai_proposed_plan)
    for item in resources:
        if isinstance(item, dict):
            res_id = str(item.get("item_id") or item.get("resource_id") or "").strip()
            if res_id:
                resource_ids.append(res_id)

    # 2. Fetch live data
    live_incident = await fetch_live_incident(client, incident_ref)
    live_resources = await fetch_live_resources(client, resource_ids)

    # 3. Classify staleness
    level, reason = evaluate_diff(snapshot_row, live_incident, live_resources)
    now_iso = datetime.now(timezone.utc).isoformat()

    # 4. Update database if Level 3 (stale)
    update_payload: Dict[str, Any] = {"updated_at": now_iso}
    if level == 3:
        update_payload["status"] = "stale"
        try:
            await client.table("decision_snapshots").update(update_payload).eq("id", snapshot_id_str).execute()
            logger.warning(f"Snapshot {snapshot_id_str} marked STALE (Level 3): {reason}")
        except Exception as exc:
            logger.error(f"Failed to update status to stale for snapshot {snapshot_id_str}: {exc}")
            raise
    else:
        try:
            await client.table("decision_snapshots").update(update_payload).eq("id", snapshot_id_str).execute()
            logger.info(f"Snapshot {snapshot_id_str} staleness check passed (Level {level}): {reason}")
        except Exception as exc:
            logger.warning(f"Failed to touch updated_at for snapshot {snapshot_id_str}: {exc}")

    # 5. Return result
    return {
        "staleness_level": level,
        "reason": reason,
    }
