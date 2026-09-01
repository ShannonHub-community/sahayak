from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4
from fastapi import WebSocket, HTTPException

from .schemas import (
    Ticket, TicketCreateRequest, TicketStatus, TicketSource, TicketInquiry, 
    InquiryStatus, InquiryCreateRequest, InquiryAnswerRequest,
    WebSocketEvent, RevertOrderRequest
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event: str, payload: dict):
        message = WebSocketEvent(event=event, payload=payload).model_dump_json()
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected_clients.append(connection)
        
        for client in disconnected_clients:
            self.disconnect(client)

manager = ConnectionManager()

# In-memory storage with pre-seeded sample data
tickets_db: Dict[UUID, Ticket] = {}
inquiries_db: Dict[UUID, TicketInquiry] = {}


def _seed_initial_tickets():
    if tickets_db:
        return

    now = datetime.now(timezone.utc)

    t1_id = UUID("11111111-1111-1111-1111-111111111111")
    t1 = Ticket(
        id=t1_id,
        order_name="NDRF Swift Water Rescue Team Deployment - Roha Sector 4",
        type="dispatch",
        department="Disaster Response / NDRF Unit 5",
        status=TicketStatus.in_progress,
        issued_by="EOC Incident Commander (Raigad Grid)",
        executed_by="Inspector Rajesh Shinde",
        source=TicketSource.workforce,
        created_at=now - timedelta(minutes=24),
        updated_at=now - timedelta(minutes=15),
    )
    tickets_db[t1_id] = t1

    inq1_id = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    inq1 = TicketInquiry(
        id=inq1_id,
        ticket_id=t1_id,
        question="Have all 6 inflatable rescue boats cleared the railway bridge choke point?",
        asked_by="Logistics Coordinator",
        response="Yes, 4 boats operational at Sector 4, 2 staged at Zilla Parishad school.",
        status=InquiryStatus.answered,
        created_at=now - timedelta(minutes=18),
        answered_at=now - timedelta(minutes=12),
    )
    inquiries_db[inq1_id] = inq1

    t2_id = UUID("22222222-2222-2222-2222-222222222222")
    t2 = Ticket(
        id=t2_id,
        order_name="Emergency Insulin & Dialysis Supply Induction - Panvel Camp",
        type="procurement",
        department="Public Health / Civil Hospital",
        status=TicketStatus.given,
        issued_by="Chief Medical Officer",
        executed_by="Dr. Suresh Patil (IMA)",
        source=TicketSource.workforce,
        created_at=now - timedelta(minutes=45),
        updated_at=now - timedelta(minutes=30),
    )
    tickets_db[t2_id] = t2

    t3_id = UUID("33333333-3333-3333-3333-333333333333")
    t3 = Ticket(
        id=t3_id,
        order_name="Secondary Flood Gate Discharge Notification - Morbe Dam",
        type="advisory",
        department="Central Water Commission & Irrigation Dept",
        status=TicketStatus.given,
        issued_by="Dam Safety Chief Engineer",
        executed_by="Flood Warning Cell",
        source=TicketSource.twin_aggregator,
        created_at=now - timedelta(minutes=10),
        updated_at=now - timedelta(minutes=8),
    )
    tickets_db[t3_id] = t3

    inq3_id = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    inq3 = TicketInquiry(
        id=inq3_id,
        ticket_id=t3_id,
        question="Confirm siren activation in down-river villages prior to 5,000 cusec release?",
        asked_by="State Disaster Management Authority",
        status=InquiryStatus.awaiting_response,
        created_at=now - timedelta(minutes=5),
    )
    inquiries_db[inq3_id] = inq3


_seed_initial_tickets()


class TicketService:
    TURNAROUND_WINDOW = timedelta(minutes=15)

    @staticmethod
    async def ingest_event(request: TicketCreateRequest) -> Ticket:
        ticket = Ticket(**request.model_dump())
        tickets_db[ticket.id] = ticket

        await manager.broadcast(
            "TICKET_CREATED",
            ticket.model_dump(mode='json')
        )
        return ticket
    
    @staticmethod
    def get_tickets(
        department: Optional[str] = None,
        ticket_type: Optional[str] = None,
        status: Optional[TicketStatus] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Ticket]:
        _seed_initial_tickets()
        result = list(tickets_db.values())

        if department:
            result = [t for t in result if t.department == department]
        if ticket_type:
            result = [t for t in result if t.type == ticket_type]
        if status:
            result = [t for t in result if t.status == status]
        if start_time:
            result = [t for t in result if t.created_at >= start_time]
        if end_time:
            result = [t for t in result if t.created_at <= end_time]

        # Return latest first
        return sorted(result, key=lambda x: x.created_at, reverse=True)

    @staticmethod
    def get_ticket(ticket_id: UUID) -> Optional[Ticket]:
        _seed_initial_tickets()
        return tickets_db.get(ticket_id)
    
    @staticmethod
    def get_ticket_inquiries(ticket_id: UUID) -> List[TicketInquiry]:
        _seed_initial_tickets()
        return [i for i in inquiries_db.values() if i.ticket_id == ticket_id]

    @staticmethod
    async def revert_order(ticket_id: UUID, request: RevertOrderRequest) -> Ticket:
        _seed_initial_tickets()
        ticket = tickets_db.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        if ticket.status not in [TicketStatus.given, TicketStatus.in_progress]:
            raise HTTPException(
                status_code=400, 
                detail="Only orders with status 'given' or 'in_progress' can be reverted"
            )

        ticket.status = TicketStatus.reverted
        ticket.revert_reason = request.revert_reason
        ticket.updated_at = datetime.now(timezone.utc)

        # Broadcast Stop Signal
        stop_signal = {
            "ticket_id": str(ticket.id),
            "order_name": ticket.order_name,
            "executed_by": ticket.executed_by,
            "reason": ticket.revert_reason,
            "timestamp": ticket.updated_at.isoformat()
        }
        await manager.broadcast("ORDER_REVERTED_STOP", stop_signal)
        
        # Broadcast Ticket Update
        await manager.broadcast("TICKET_UPDATED", ticket.model_dump(mode='json'))

        return ticket
    
    @staticmethod
    async def submit_inquiry(ticket_id: UUID, request: InquiryCreateRequest) -> TicketInquiry:
        _seed_initial_tickets()
        ticket = tickets_db.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        inquiry = TicketInquiry(
            ticket_id=ticket_id,
            question=request.question,
            asked_by=request.asked_by,
            status=InquiryStatus.awaiting_response
        )
        inquiries_db[inquiry.id] = inquiry

        await manager.broadcast("INQUIRY_UPDATED", inquiry.model_dump(mode='json'))
        
        badge_count = TicketService.get_pending_badge_count()
        await manager.broadcast("BADGE_COUNT_UPDATED", {"pending_inquiries_count": badge_count})

        return inquiry
    
    @staticmethod
    async def answer_inquiry(ticket_id: UUID, inquiry_id: UUID, request: InquiryAnswerRequest) -> TicketInquiry:
        _seed_initial_tickets()
        ticket = tickets_db.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        inquiry = inquiries_db.get(inquiry_id)
        if not inquiry or inquiry.ticket_id != ticket_id:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        inquiry.response = request.response
        inquiry.status = InquiryStatus.answered
        inquiry.answered_at = datetime.now(timezone.utc)

        await manager.broadcast("INQUIRY_UPDATED", inquiry.model_dump(mode='json'))
        
        badge_count = TicketService.get_pending_badge_count()
        await manager.broadcast("BADGE_COUNT_UPDATED", {"pending_inquiries_count": badge_count})

        return inquiry

    @staticmethod
    def get_pending_badge_count() -> int:
        _seed_initial_tickets()
        count = sum(
            1 for i in inquiries_db.values() 
            if i.status in [InquiryStatus.awaiting_response, InquiryStatus.overdue]
        )
        return count

    @staticmethod
    async def check_overdue_inquiries():
        """Background task to transition awaiting_response inquiries to overdue"""
        changed = False
        current_time = datetime.now(timezone.utc)
        for inquiry in inquiries_db.values():
            if inquiry.status == InquiryStatus.awaiting_response:
                if current_time - inquiry.created_at > TicketService.TURNAROUND_WINDOW:
                    inquiry.status = InquiryStatus.overdue
                    changed = True
                    await manager.broadcast("INQUIRY_UPDATED", inquiry.model_dump(mode='json'))

        if changed:
            badge_count = TicketService.get_pending_badge_count()
            await manager.broadcast("BADGE_COUNT_UPDATED", {"pending_inquiries_count": badge_count})
