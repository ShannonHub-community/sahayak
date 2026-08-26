from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from services.resource_service.schemas import (
    ResourceCreate, ResourceUpdate, ResourceResponse,
    DonationTransferEvent, HandoverRequest, AIInsightResponse,
    BroadcastNeedRequest, WorkforceRequestSchema
)
from services.resource_service.service import ResourceService

router = APIRouter()


# ── WebSocket Connection Manager ───────────────────────────────────────
class ConnectionManager:
    """Manages active WebSocket connections and broadcasts events."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, payload: Any):
        for connection in self.active_connections:
            await connection.send_json({"event": event_type, "payload": payload})


manager = ConnectionManager()


def get_resource_service():
    return ResourceService()


# ── REST Endpoints ─────────────────────────────────────────────────────

@router.get("/", response_model=List[ResourceResponse])
async def list_resources(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    service: ResourceService = Depends(get_resource_service),
):
    """List/filter resources (query params: category, status, zone, search)."""
    return await service.get_resources(category=category, status=status, zone=zone, search=search)


@router.post("/", response_model=ResourceResponse)
async def create_government_stock(
    data: ResourceCreate,
    service: ResourceService = Depends(get_resource_service),
):
    """Create manual government stock record."""
    result = await service.ingest_government_stock(data)
    await manager.broadcast("INVENTORY_UPDATE", result.model_dump(mode='json'))
    return result


@router.get("/insights", response_model=List[AIInsightResponse])
async def get_insights(service: ResourceService = Depends(get_resource_service)):
    """Fetch active AI depletion/overcrowding insight cards."""
    insights = await service.evaluate_insights()
    # Broadcast any active alerts to connected clients
    for insight in insights:
        await manager.broadcast("AI_INSIGHT_ALERT", insight.model_dump(mode='json'))
    return insights


@router.get("/workforce/queue", response_model=List[WorkforceRequestSchema])
async def get_workforce_queue():
    """Fetch pending field workforce requests (bridged from Workforce Portal)."""
    return []


@router.get("/{id}", response_model=ResourceResponse)
async def get_resource(id: str, service: ResourceService = Depends(get_resource_service)):
    """Retrieve specific resource details."""
    return await service.get_resource_by_id(id)


@router.patch("/{id}", response_model=ResourceResponse)
async def update_resource(
    id: str,
    data: ResourceUpdate,
    service: ResourceService = Depends(get_resource_service),
):
    """Update resource details (status, quantity, occupancy)."""
    result = await service.update_resource(id, data)
    await manager.broadcast("INVENTORY_UPDATE", result.model_dump(mode='json'))
    return result


@router.post("/donations/transfer", response_model=ResourceResponse)
async def ingest_donation(
    data: DonationTransferEvent,
    service: ResourceService = Depends(get_resource_service),
):
    """Ingest approved transfer from Donation Coordinator."""
    result = await service.ingest_donation_transfer(data)
    await manager.broadcast("INVENTORY_UPDATE", result.model_dump(mode='json'))
    return result


@router.post("/dispatch/handover", response_model=ResourceResponse)
async def execute_handover(
    data: HandoverRequest,
    service: ResourceService = Depends(get_resource_service),
):
    """Execute resource handover to a workforce team."""
    result = await service.execute_handover(data)
    await manager.broadcast("HANDOVER_EXECUTED", result.model_dump(mode='json'))
    return result


@router.post("/broadcast-need")
async def broadcast_need(
    data: BroadcastNeedRequest,
    service: ResourceService = Depends(get_resource_service),
):
    """Broadcast deficit to Citizen Donation Portal."""
    result = await service.broadcast_need(data)
    await manager.broadcast("BROADCAST_TRIGGERED", result)
    return result


# ── WebSocket Endpoint ─────────────────────────────────────────────────

@router.websocket("/ws/resources")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time event stream: INVENTORY_UPDATE, HANDOVER_EXECUTED, AI_INSIGHT_ALERT, BROADCAST_TRIGGERED."""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
