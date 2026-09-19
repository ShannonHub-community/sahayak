import collections.abc
from typing import List, Dict, Optional, MutableMapping
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4
from fastapi import WebSocket, HTTPException

from .schemas import (
    Ticket, TicketCreateRequest, TicketStatus, TicketSource, TicketInquiry, 
    InquiryStatus, InquiryCreateRequest, InquiryAnswerRequest,
    WebSocketEvent, RevertOrderRequest
)
from database.local_sqlite import (
    get_db_session,
    AuditRecord,
    InquiryRecord,
    init_db,
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


# ---------------------------------------------------------------------------
# SQLite-Backed Dictionary Proxies (maintains full backward compatibility)
# ---------------------------------------------------------------------------
class TicketsDBProxy(collections.abc.MutableMapping):
    def __getitem__(self, key: UUID) -> Ticket:
        with get_db_session() as session:
            row = session.query(AuditRecord).filter(AuditRecord.id == str(key)).first()
            if not row:
                raise KeyError(key)
            return row.to_schema()

    def __setitem__(self, key: UUID, value: Ticket):
        with get_db_session() as session:
            status_val = value.status.value if hasattr(value.status, "value") else str(value.status)
            source_val = value.source.value if hasattr(value.source, "value") else str(value.source)
            row = session.query(AuditRecord).filter(AuditRecord.id == str(key)).first()
            if not row:
                row = AuditRecord(
                    id=str(key),
                    order_name=value.order_name,
                    type=value.type,
                    department=value.department,
                    status=status_val,
                    issued_by=value.issued_by,
                    executed_by=value.executed_by,
                    source=source_val,
                    revert_reason=value.revert_reason,
                    created_at=value.created_at,
                    updated_at=value.updated_at,
                )
                session.add(row)
            else:
                row.order_name = value.order_name
                row.type = value.type
                row.department = value.department
                row.status = status_val
                row.issued_by = value.issued_by
                row.executed_by = value.executed_by
                row.source = source_val
                row.revert_reason = value.revert_reason
                row.created_at = value.created_at
                row.updated_at = value.updated_at
            session.commit()

    def __delitem__(self, key: UUID):
        with get_db_session() as session:
            deleted = session.query(AuditRecord).filter(AuditRecord.id == str(key)).delete()
            session.commit()
            if not deleted:
                raise KeyError(key)

    def __iter__(self):
        with get_db_session() as session:
            ids = [UUID(r.id) for r in session.query(AuditRecord.id).all()]
            return iter(ids)

    def __len__(self):
        with get_db_session() as session:
            return session.query(AuditRecord).count()

    def clear(self):
        with get_db_session() as session:
            session.query(AuditRecord).delete()
            session.commit()

    def get(self, key: UUID, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def values(self):
        with get_db_session() as session:
            return [r.to_schema() for r in session.query(AuditRecord).all()]


class InquiriesDBProxy(collections.abc.MutableMapping):
    def __getitem__(self, key: UUID) -> TicketInquiry:
        with get_db_session() as session:
            row = session.query(InquiryRecord).filter(InquiryRecord.id == str(key)).first()
            if not row:
                raise KeyError(key)
            return row.to_schema()

    def __setitem__(self, key: UUID, value: TicketInquiry):
        with get_db_session() as session:
            status_val = value.status.value if hasattr(value.status, "value") else str(value.status)
            row = session.query(InquiryRecord).filter(InquiryRecord.id == str(key)).first()
            if not row:
                row = InquiryRecord(
                    id=str(key),
                    ticket_id=str(value.ticket_id),
                    question=value.question,
                    response=value.response,
                    asked_by=value.asked_by,
                    status=status_val,
                    created_at=value.created_at,
                    answered_at=value.answered_at,
                )
                session.add(row)
            else:
                row.ticket_id = str(value.ticket_id)
                row.question = value.question
                row.response = value.response
                row.asked_by = value.asked_by
                row.status = status_val
                row.created_at = value.created_at
                row.answered_at = value.answered_at
            session.commit()

    def __delitem__(self, key: UUID):
        with get_db_session() as session:
            deleted = session.query(InquiryRecord).filter(InquiryRecord.id == str(key)).delete()
            session.commit()
            if not deleted:
                raise KeyError(key)

    def __iter__(self):
        with get_db_session() as session:
            ids = [UUID(r.id) for r in session.query(InquiryRecord.id).all()]
            return iter(ids)

    def __len__(self):
        with get_db_session() as session:
            return session.query(InquiryRecord).count()

    def clear(self):
        with get_db_session() as session:
            session.query(InquiryRecord).delete()
            session.commit()

    def get(self, key: UUID, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def values(self):
        with get_db_session() as session:
            return [r.to_schema() for r in session.query(InquiryRecord).all()]


tickets_db: MutableMapping[UUID, Ticket] = TicketsDBProxy()
inquiries_db: MutableMapping[UUID, TicketInquiry] = InquiriesDBProxy()


_has_seeded = False


def _seed_initial_tickets():
    """Ensures database tables are created and baseline records exist."""
    global _has_seeded
    if _has_seeded or len(tickets_db) > 0:
        return
    init_db()
    _has_seeded = True


class TicketService:
    TURNAROUND_WINDOW = timedelta(minutes=15)

    @staticmethod
    async def ingest_event(request: TicketCreateRequest) -> Ticket:
        ticket = Ticket(**request.model_dump())
        with get_db_session() as session:
            status_val = ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status)
            source_val = ticket.source.value if hasattr(ticket.source, "value") else str(ticket.source)
            record = AuditRecord(
                id=str(ticket.id),
                order_name=ticket.order_name,
                type=ticket.type,
                department=ticket.department,
                status=status_val,
                issued_by=ticket.issued_by,
                executed_by=ticket.executed_by,
                source=source_val,
                revert_reason=ticket.revert_reason,
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
            )
            session.add(record)
            session.commit()

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
        with get_db_session() as session:
            query = session.query(AuditRecord)

            if department:
                query = query.filter(AuditRecord.department == department)
            if ticket_type:
                query = query.filter(AuditRecord.type == ticket_type)
            if status:
                status_str = status.value if hasattr(status, "value") else str(status)
                query = query.filter(AuditRecord.status == status_str)
            if start_time:
                query = query.filter(AuditRecord.created_at >= start_time)
            if end_time:
                query = query.filter(AuditRecord.created_at <= end_time)

            # Return latest first
            query = query.order_by(AuditRecord.created_at.desc())
            records = query.all()
            return [r.to_schema() for r in records]

    @staticmethod
    def get_ticket(ticket_id: UUID) -> Optional[Ticket]:
        _seed_initial_tickets()
        with get_db_session() as session:
            record = session.query(AuditRecord).filter(AuditRecord.id == str(ticket_id)).first()
            return record.to_schema() if record else None
    
    @staticmethod
    def get_ticket_inquiries(ticket_id: UUID) -> List[TicketInquiry]:
        _seed_initial_tickets()
        with get_db_session() as session:
            records = session.query(InquiryRecord).filter(InquiryRecord.ticket_id == str(ticket_id)).all()
            return [r.to_schema() for r in records]

    @staticmethod
    async def revert_order(ticket_id: UUID, request: RevertOrderRequest) -> Ticket:
        _seed_initial_tickets()
        with get_db_session() as session:
            record = session.query(AuditRecord).filter(AuditRecord.id == str(ticket_id)).first()
            if not record:
                raise HTTPException(status_code=404, detail="Ticket not found")

            if record.status not in [TicketStatus.given.value, TicketStatus.in_progress.value, "given", "in_progress"]:
                raise HTTPException(
                    status_code=400, 
                    detail="Only orders with status 'given' or 'in_progress' can be reverted"
                )

            now = datetime.now(timezone.utc)
            record.status = TicketStatus.reverted.value
            record.revert_reason = request.revert_reason
            record.updated_at = now
            session.commit()
            session.refresh(record)
            ticket = record.to_schema()

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
        with get_db_session() as session:
            ticket_record = session.query(AuditRecord).filter(AuditRecord.id == str(ticket_id)).first()
            if not ticket_record:
                raise HTTPException(status_code=404, detail="Ticket not found")

            inquiry = TicketInquiry(
                ticket_id=ticket_id,
                question=request.question,
                asked_by=request.asked_by,
                status=InquiryStatus.awaiting_response
            )
            record = InquiryRecord(
                id=str(inquiry.id),
                ticket_id=str(ticket_id),
                question=inquiry.question,
                asked_by=inquiry.asked_by,
                status=inquiry.status.value,
                created_at=inquiry.created_at,
            )
            session.add(record)
            session.commit()

        await manager.broadcast("INQUIRY_UPDATED", inquiry.model_dump(mode='json'))
        
        badge_count = TicketService.get_pending_badge_count()
        await manager.broadcast("BADGE_COUNT_UPDATED", {"pending_inquiries_count": badge_count})

        return inquiry
    
    @staticmethod
    async def answer_inquiry(ticket_id: UUID, inquiry_id: UUID, request: InquiryAnswerRequest) -> TicketInquiry:
        _seed_initial_tickets()
        with get_db_session() as session:
            ticket_record = session.query(AuditRecord).filter(AuditRecord.id == str(ticket_id)).first()
            if not ticket_record:
                raise HTTPException(status_code=404, detail="Ticket not found")
            
            record = session.query(InquiryRecord).filter(
                InquiryRecord.id == str(inquiry_id),
                InquiryRecord.ticket_id == str(ticket_id)
            ).first()
            if not record:
                raise HTTPException(status_code=404, detail="Inquiry not found")

            now = datetime.now(timezone.utc)
            record.response = request.response
            record.status = InquiryStatus.answered.value
            record.answered_at = now
            session.commit()
            session.refresh(record)
            inquiry = record.to_schema()

        await manager.broadcast("INQUIRY_UPDATED", inquiry.model_dump(mode='json'))
        
        badge_count = TicketService.get_pending_badge_count()
        await manager.broadcast("BADGE_COUNT_UPDATED", {"pending_inquiries_count": badge_count})

        return inquiry

    @staticmethod
    def get_pending_badge_count() -> int:
        _seed_initial_tickets()
        with get_db_session() as session:
            count = session.query(InquiryRecord).filter(
                InquiryRecord.status.in_([InquiryStatus.awaiting_response.value, InquiryStatus.overdue.value, "awaiting_response", "overdue"])
            ).count()
            return count

    @staticmethod
    async def check_overdue_inquiries():
        """Background task to transition awaiting_response inquiries to overdue"""
        changed = False
        current_time = datetime.now(timezone.utc)
        updated_inquiries = []

        with get_db_session() as session:
            records = session.query(InquiryRecord).filter(
                InquiryRecord.status.in_([InquiryStatus.awaiting_response.value, "awaiting_response"])
            ).all()

            for r in records:
                created_at = r.created_at
                if created_at and created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)

                if current_time - created_at > TicketService.TURNAROUND_WINDOW:
                    r.status = InquiryStatus.overdue.value
                    changed = True
                    updated_inquiries.append(r.to_schema())

            if changed:
                session.commit()

        for inquiry in updated_inquiries:
            await manager.broadcast("INQUIRY_UPDATED", inquiry.model_dump(mode='json'))

        if changed:
            badge_count = TicketService.get_pending_badge_count()
            await manager.broadcast("BADGE_COUNT_UPDATED", {"pending_inquiries_count": badge_count})
