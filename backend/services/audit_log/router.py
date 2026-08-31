import asyncio
from typing import List, Optional
from uuid import UUID
from contextlib import asynccontextmanager
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from .schemas import (
    TicketCreateRequest, TicketResponse, TicketFilterParams,
    RevertOrderRequest, InquiryCreateRequest, InquiryAnswerRequest,
    BadgeCountResponse
)
from .service import TicketService, manager

router = APIRouter(tags=["Audit Log / Tickets"])


async def _background_overdue_check():
    """Periodic loop that transitions stale inquiries to overdue."""
    while True:
        await asyncio.sleep(60)  # Check every 60 seconds
        await TicketService.check_overdue_inquiries()


@asynccontextmanager
async def audit_log_lifespan(app):
    task = asyncio.create_task(_background_overdue_check())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


# ---------------------------------------------------------------------------
# Ticket Endpoints (Supported at both /api/tickets and /api/v1/audit/tickets)
# ---------------------------------------------------------------------------

@router.post("/api/tickets", response_model=TicketResponse, status_code=201)
@router.post("/api/v1/audit/tickets", response_model=TicketResponse, status_code=201)
async def create_ticket(request: TicketCreateRequest):
    ticket = await TicketService.ingest_event(request)
    return TicketResponse(**ticket.model_dump(), inquiries=[])


@router.get("/api/tickets", response_model=List[TicketResponse])
@router.get("/api/v1/audit/tickets", response_model=List[TicketResponse])
def list_tickets(params: TicketFilterParams = Depends()):
    tickets = TicketService.get_tickets(
        department=params.department,
        ticket_type=params.type,
        status=params.status,
        start_time=params.start_time,
        end_time=params.end_time
    )
    
    response = []
    for t in tickets:
        inquiries = TicketService.get_ticket_inquiries(t.id)
        response.append(TicketResponse(**t.model_dump(), inquiries=inquiries))
    return response


@router.get("/api/tickets/badge-count", response_model=BadgeCountResponse)
@router.get("/api/v1/audit/badge-count", response_model=BadgeCountResponse)
def get_badge_count():
    count = TicketService.get_pending_badge_count()
    return BadgeCountResponse(pending_inquiries_count=count)


@router.get("/api/tickets/{ticket_id}", response_model=TicketResponse)
@router.get("/api/v1/audit/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: UUID):
    ticket = TicketService.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    inquiries = TicketService.get_ticket_inquiries(ticket_id)
    return TicketResponse(**ticket.model_dump(), inquiries=inquiries)


@router.post("/api/tickets/{ticket_id}/revert", response_model=TicketResponse)
@router.post("/api/v1/audit/tickets/{ticket_id}/revert", response_model=TicketResponse)
async def revert_order(ticket_id: UUID, request: RevertOrderRequest):
    ticket = await TicketService.revert_order(ticket_id, request)
    inquiries = TicketService.get_ticket_inquiries(ticket_id)
    return TicketResponse(**ticket.model_dump(), inquiries=inquiries)


@router.post("/api/tickets/{ticket_id}/inquiries", response_model=TicketResponse)
@router.post("/api/v1/audit/tickets/{ticket_id}/inquire", response_model=TicketResponse)
@router.post("/api/v1/audit/tickets/{ticket_id}/inquiries", response_model=TicketResponse)
async def submit_inquiry(ticket_id: UUID, request: InquiryCreateRequest):
    await TicketService.submit_inquiry(ticket_id, request)
    
    ticket = TicketService.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    inquiries = TicketService.get_ticket_inquiries(ticket_id)
    return TicketResponse(**ticket.model_dump(), inquiries=inquiries)


@router.patch("/api/tickets/{ticket_id}/inquiries/{inquiry_id}/answer", response_model=TicketResponse)
@router.patch("/api/v1/audit/tickets/{ticket_id}/inquiries/{inquiry_id}/answer", response_model=TicketResponse)
async def answer_inquiry(ticket_id: UUID, inquiry_id: UUID, request: InquiryAnswerRequest):
    await TicketService.answer_inquiry(ticket_id, inquiry_id, request)
    
    ticket = TicketService.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    inquiries = TicketService.get_ticket_inquiries(ticket_id)
    return TicketResponse(**ticket.model_dump(), inquiries=inquiries)


@router.websocket("/api/tickets/ws")
@router.websocket("/api/v1/audit/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
