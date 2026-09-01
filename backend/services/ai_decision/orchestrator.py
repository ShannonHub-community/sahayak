"""
AI Decision System - Orchestrator Module
Wires together the entire AI Decision lifecycle:
1. `request_ai_plan`: Runs Steps 1-6 (Snapshot -> Procedure -> Reasoning -> Validator)
2. `approve_plan`: Checks staleness (Step 7), approves if valid, and creates an audit record in `tickets`
3. `reject_plan`: Rejects snapshot with reason and creates an audit record in `tickets`

STRICT RULES:
- All DB operations use the shared async Supabase client.
- Approval requires Level 1 or Level 2 staleness (Level 3 aborts).
- Every approved or rejected decision logs to `tickets` with `decision_snapshot_id`.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException
from shared.supabase import get_async_supabase_client

from services.ai_decision.snapshot import create_decision_snapshot
from services.ai_decision.procedure import match_and_attach_procedure
from services.ai_decision.reasoning import generate_ai_recommendation
from services.ai_decision.validator import validate_ai_plan
from services.ai_decision.staleness import check_staleness

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# WebSocket Broadcast Helper (optional real-time push)
# ---------------------------------------------------------------------------
_active_ws_connections: List[Any] = []


def register_ws_client(ws: Any) -> None:
    _active_ws_connections.append(ws)


def unregister_ws_client(ws: Any) -> None:
    if ws in _active_ws_connections:
        _active_ws_connections.remove(ws)


async def broadcast_decision_event(event_type: str, payload: Dict[str, Any]) -> None:
    """Broadcasts decision events to any connected frontend WebSockets."""
    for ws in list(_active_ws_connections):
        try:
            await ws.send_json({"event": event_type, "payload": payload})
        except Exception as e:
            logger.debug(f"Failed to send decision event to client: {e}")
            unregister_ws_client(ws)


# ---------------------------------------------------------------------------
# Orchestrator Lifecycle Functions
# ---------------------------------------------------------------------------

async def request_ai_plan(
    incident_ref: Union[str, UUID],
    disaster_type: str = "flood",
    priority_level: Optional[str] = None,
    injury_severity: Optional[str] = None,
    override_incident_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes the full forward AI Decision pipeline:
    - Step 1-3: Capture and freeze environment state into `decision_snapshots` (`snapshot.py`)
    - Step 4: Deterministically match operational procedure (`procedure.py`)
    - Step 5: Generate AI logistics recommendation via Lyzr AI (`reasoning.py`)
    - Step 6: Deterministically validate schema, stock, and constraints (`validator.py`)

    Returns the complete `decision_snapshots` database record.
    """
    client = await get_async_supabase_client()
    incident_id_str = str(incident_ref)

    logger.info(f"Initiating AI Decision pipeline for incident: {incident_id_str}")

    # 1. Step 1-3: Create immutable snapshot
    snapshot_record = await create_decision_snapshot(
        incident_ref=incident_id_str,
        disaster_type=disaster_type,
        priority_level=priority_level,
        injury_severity=injury_severity,
        override_incident_data=override_incident_data,
    )
    snapshot_id = snapshot_record["id"]
    logger.info(f"Snapshot created: {snapshot_id}")

    try:
        # 2. Step 4: Match and link procedure
        procedure = await match_and_attach_procedure(
            snapshot_id=snapshot_id,
            disaster_type=snapshot_record.get("disaster_type", disaster_type),
            priority_level=snapshot_record.get("priority_level", priority_level),
            injury_severity=snapshot_record.get("injury_severity", injury_severity),
        )
        logger.info(f"Procedure linked: {procedure.get('id')}")

        # 3. Step 5: Call Lyzr AI reasoning engine
        ai_plan = await generate_ai_recommendation(snapshot_id=snapshot_id)
        logger.info(f"AI Plan generated with confidence: {ai_plan.get('confidence')}")

        # 4. Step 6: Validate plan against snapshot & procedure math
        validation_result = await validate_ai_plan(snapshot_id=snapshot_id)
        logger.info(f"Validation finished: valid={validation_result.get('valid')}")

    except Exception as exc:
        logger.error(f"Error during AI plan generation for snapshot {snapshot_id}: {exc}")
        # Re-fetch whatever partial state was saved
        res = await client.table("decision_snapshots").select("*").eq("id", snapshot_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        raise

    # 5. Fetch and return full final record
    final_res = await client.table("decision_snapshots").select("*").eq("id", snapshot_id).execute()
    final_record = final_res.data[0] if final_res.data else snapshot_record

    await broadcast_decision_event("AI_PLAN_PROPOSED", final_record)
    return final_record


async def approve_plan(
    snapshot_id: Union[str, UUID],
    officer_id: str = "Admin Officer",
) -> Dict[str, Any]:
    """
    Approves a validated AI plan:
    1. Checks real-time staleness (Step 7).
    2. Aborts if Level 3 (Stale).
    3. If Level 1/2: Marks status as 'approved'.
    4. Logs an audit record to the `tickets` table referencing `decision_snapshot_id`.
    5. Dispatches real-time broadcast event to workforce and map clients.

    Raises:
        HTTPException: If the snapshot is stale (409 Conflict) or not found (404).
    """
    client = await get_async_supabase_client()
    snapshot_id_str = str(snapshot_id)

    # 1. Fetch snapshot
    snap_res = await client.table("decision_snapshots").select("*").eq("id", snapshot_id_str).execute()
    if not snap_res.data or len(snap_res.data) == 0:
        raise HTTPException(status_code=404, detail=f"Decision snapshot '{snapshot_id_str}' not found.")

    snapshot_row = snap_res.data[0]

    # Check if already approved/rejected
    if snapshot_row.get("status") == "approved":
        return {"status": "approved", "message": "Plan is already approved.", "snapshot": snapshot_row}

    # 2. Check staleness (Step 7)
    staleness = await check_staleness(snapshot_id_str)
    if staleness.get("staleness_level") == 3:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "PLAN_STALE",
                "message": f"Cannot approve plan: live conditions have changed (Level 3). Reason: {staleness.get('reason')}",
                "staleness": staleness,
                "action_required": "RE_RUN_PLAN",
            },
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    # 3. Update snapshot status to 'approved'
    update_payload = {
        "status": "approved",
        "reviewed_by": officer_id,
        "reviewed_at": now_iso,
        "updated_at": now_iso,
    }
    await client.table("decision_snapshots").update(update_payload).eq("id", snapshot_id_str).execute()

    # 4. Mandatory Audit Trail Logging in `tickets` table (Rule 6)
    incident_ref = snapshot_row.get("incident_ref", "unknown")
    disaster_type = snapshot_row.get("disaster_type", "flood").capitalize()
    priority_level = snapshot_row.get("priority_level", "high").capitalize()

    ticket_record = {
        "id": str(uuid.uuid4()),
        "order_name": f"AI Plan Approved [Snap: {snapshot_id_str[:8]}]: {disaster_type} Evacuation & Resource Deployment ({priority_level} Priority)",
        "type": "Resource Dispatch & Evacuation",
        "department": "Disaster Logistics & Command",
        "status": "proceeded",
        "issued_by": officer_id,
        "executed_by": "Field Workforce Teams",
        "source": "ai_decision",
        "revert_reason": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    try:
        await client.table("tickets").insert(ticket_record).execute()
        logger.info(f"Audit log created in tickets table for approved snapshot: {snapshot_id_str}")
    except Exception as exc:
        logger.warning(f"Could not insert audit record into tickets table: {exc}")

    # Fetch updated record
    updated_snap_res = await client.table("decision_snapshots").select("*").eq("id", snapshot_id_str).execute()
    updated_snapshot = updated_snap_res.data[0] if updated_snap_res.data else snapshot_row

    # 5. Broadcast event to WebSocket subscribers
    await broadcast_decision_event("AI_PLAN_APPROVED", {
        "snapshot": updated_snapshot,
        "ticket": ticket_record,
        "staleness": staleness,
    })

    return {
        "status": "approved",
        "snapshot_id": snapshot_id_str,
        "staleness": staleness,
        "ticket": ticket_record,
        "snapshot": updated_snapshot,
    }


async def reject_plan(
    snapshot_id: Union[str, UUID],
    reason: str,
    officer_id: str = "Admin Officer",
) -> Dict[str, Any]:
    """
    Rejects an AI plan with a human officer's stated justification:
    1. Updates snapshot status to 'rejected' and stores `rejection_reason`.
    2. Writes an immutable audit entry into `tickets` with `status: 'reverted'`.
    3. Dispatches real-time broadcast event.
    """
    client = await get_async_supabase_client()
    snapshot_id_str = str(snapshot_id)

    # 1. Fetch snapshot
    snap_res = await client.table("decision_snapshots").select("*").eq("id", snapshot_id_str).execute()
    if not snap_res.data or len(snap_res.data) == 0:
        raise HTTPException(status_code=404, detail=f"Decision snapshot '{snapshot_id_str}' not found.")

    snapshot_row = snap_res.data[0]
    now_iso = datetime.now(timezone.utc).isoformat()

    # 2. Update snapshot status
    update_payload = {
        "status": "rejected",
        "rejection_reason": reason,
        "reviewed_by": officer_id,
        "reviewed_at": now_iso,
        "updated_at": now_iso,
    }
    await client.table("decision_snapshots").update(update_payload).eq("id", snapshot_id_str).execute()

    # 3. Mandatory Audit Trail Logging in `tickets` table (Rule 6)
    ticket_record = {
        "id": str(uuid.uuid4()),
        "order_name": f"AI Plan Rejected [Snap: {snapshot_id_str[:8]}]: {reason[:40]}...",
        "type": "AI Decision Rejection",
        "department": "Disaster Logistics & Command",
        "status": "reverted",
        "issued_by": officer_id,
        "executed_by": "None",
        "source": "ai_decision",
        "revert_reason": reason,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    try:
        await client.table("tickets").insert(ticket_record).execute()
        logger.info(f"Audit log created in tickets table for rejected snapshot: {snapshot_id_str}")
    except Exception as exc:
        logger.warning(f"Could not insert rejection audit record into tickets table: {exc}")

    # Fetch updated record
    updated_snap_res = await client.table("decision_snapshots").select("*").eq("id", snapshot_id_str).execute()
    updated_snapshot = updated_snap_res.data[0] if updated_snap_res.data else snapshot_row

    # 4. Broadcast event
    await broadcast_decision_event("AI_PLAN_REJECTED", {
        "snapshot": updated_snapshot,
        "ticket": ticket_record,
        "reason": reason,
    })

    return {
        "status": "rejected",
        "snapshot_id": snapshot_id_str,
        "rejection_reason": reason,
        "ticket": ticket_record,
        "snapshot": updated_snapshot,
    }
