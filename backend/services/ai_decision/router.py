"""
AI Decision System - FastAPI Router
Exposes public endpoints for the AI Decision System:
1. `POST /api/v1/ai-decision/recommend` -> Generate a complete validated AI decision plan
2. `POST /api/v1/ai-decision/{snapshot_id}/approve` -> Approve decision with staleness verification & ticket audit
3. `POST /api/v1/ai-decision/{snapshot_id}/reject` -> Reject decision with reason & ticket audit
4. `GET  /api/v1/ai-decision/{snapshot_id}/staleness` -> Real-time staleness poll
5. `GET  /api/v1/ai-decision/{snapshot_id}` -> Fetch snapshot details
6. `POST /api/v1/ai-decision/chat` -> Conversational disaster intelligence assistant
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from shared.supabase import get_async_supabase_client
from services.ai_decision.orchestrator import (
    request_ai_plan,
    approve_plan,
    reject_plan,
    register_ws_client,
    unregister_ws_client,
)
from services.ai_decision.staleness import check_staleness
from services.ai_decision.reasoning import generate_chat_response

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/ai-decision",
    tags=["AI Decision System"],
)


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class RecommendRequest(BaseModel):
    incident_ref: UUID = Field(..., description="UUID reference of the SOS or Twin incident")
    disaster_type: str = Field(default="flood", description="Disaster scenario type ('flood')")
    priority_level: Optional[str] = Field(default=None, description="Optional override priority ('high', 'medium', 'low')")
    injury_severity: Optional[str] = Field(default=None, description="Optional override injury ('critical', 'moderate', 'none')")
    override_incident_data: Optional[Dict[str, Any]] = Field(default=None, description="Optional mock/inline incident state")


class ApproveRequest(BaseModel):
    officer_id: str = Field(default="Commanding Officer", description="Identifier of the approving officer")


class RejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Justification for rejecting the AI recommendation")
    officer_id: str = Field(default="Commanding Officer", description="Identifier of the rejecting officer")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Natural language question for the AI intelligence assistant")


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat", status_code=200)
async def chat_with_ai(request: ChatRequest) -> Dict[str, str]:
    """
    Conversational Disaster Intelligence Endpoint:
    Processes commander natural language queries with live telemetry context
    and returns concise answers via Lyzr AI.
    """
    try:
        reply_text = await generate_chat_response(request.message)
        return {"reply": reply_text}
    except Exception as e:
        logger.error(f"Chat API error: {e}")
        raise HTTPException(status_code=500, detail=f"Intelligence chat failed: {str(e)}")


@router.post("/recommend", status_code=200)
async def generate_recommendation(request: RecommendRequest) -> Dict[str, Any]:
    """
    Triggers the end-to-end AI Decision Pipeline (Steps 1 through 6):
    1. Freezes current state in an immutable snapshot.
    2. Matches deterministic response procedure.
    3. Generates logistics recommendation with Lyzr AI.
    4. Validates schema, inventory availability, and constraint math.
    Returns the complete decision snapshot.
    """
    try:
        snapshot = await request_ai_plan(
            incident_ref=request.incident_ref,
            disaster_type=request.disaster_type,
            priority_level=request.priority_level,
            injury_severity=request.injury_severity,
            override_incident_data=request.override_incident_data,
        )
        return snapshot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate AI plan: {e}")
        raise HTTPException(status_code=500, detail=f"AI Decision generation failed: {str(e)}")


@router.post("/{snapshot_id}/approve", status_code=200)
async def approve_recommendation(
    snapshot_id: UUID,
    request: ApproveRequest = ApproveRequest(),
) -> Dict[str, Any]:
    """
    Approves a validated AI plan:
    - Runs real-time staleness check (aborts if Level 3 stale).
    - Transitions snapshot status to 'approved'.
    - Logs immutable audit record to `tickets` table referencing `decision_snapshot_id`.
    """
    return await approve_plan(snapshot_id=snapshot_id, officer_id=request.officer_id)


@router.post("/{snapshot_id}/reject", status_code=200)
async def reject_recommendation(
    snapshot_id: UUID,
    request: RejectRequest,
) -> Dict[str, Any]:
    """
    Rejects an AI plan:
    - Transitions snapshot status to 'rejected' with reason.
    - Logs immutable audit record to `tickets` table with status 'reverted'.
    """
    return await reject_plan(
        snapshot_id=snapshot_id,
        reason=request.reason,
        officer_id=request.officer_id,
    )


@router.get("/{snapshot_id}/staleness", status_code=200)
async def get_staleness_status(snapshot_id: UUID) -> Dict[str, Any]:
    """
    Polls the real-time staleness diff engine for a given snapshot:
    Returns { "staleness_level": 1|2|3, "reason": "..." }
    """
    try:
        return await check_staleness(snapshot_id=snapshot_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{snapshot_id}", status_code=200)
async def get_snapshot_details(snapshot_id: UUID) -> Dict[str, Any]:
    """
    Retrieves full details of a specific decision snapshot.
    """
    client = await get_async_supabase_client()
    res = await client.table("decision_snapshots").select("*").eq("id", str(snapshot_id)).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Decision snapshot not found.")
    return res.data[0]


@router.get("/incident/{incident_ref}", status_code=200)
async def get_snapshots_by_incident(incident_ref: UUID) -> List[Dict[str, Any]]:
    """
    Lists all decision snapshots generated for a specific incident.
    """
    client = await get_async_supabase_client()
    res = (
        await client.table("decision_snapshots")
        .select("*")
        .eq("incident_ref", str(incident_ref))
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


# ---------------------------------------------------------------------------
# Real-time WebSocket Endpoint
# ---------------------------------------------------------------------------

@router.websocket("/ws")
async def websocket_decision_stream(websocket: WebSocket):
    """
    WebSocket endpoint broadcasting real-time AI decision events
    ('AI_PLAN_PROPOSED', 'AI_PLAN_APPROVED', 'AI_PLAN_REJECTED').
    """
    await websocket.accept()
    register_ws_client(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        unregister_ws_client(websocket)
    except Exception:
        unregister_ws_client(websocket)
