import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from fastapi import HTTPException
from unittest.mock import AsyncMock, patch

from ..schemas import (
    TicketCreateRequest, TicketStatus, TicketSource,
    RevertOrderRequest, InquiryCreateRequest, InquiryAnswerRequest,
    InquiryStatus, TicketInquiry, Ticket
)
from ..service import TicketService, manager, tickets_db, inquiries_db

@pytest.fixture(autouse=True)
def reset_db():
    # Clear the databases before each test
    tickets_db.clear()
    inquiries_db.clear()

@pytest.fixture
def mock_broadcast():
    with patch.object(manager, 'broadcast', new_callable=AsyncMock) as mock:
        yield mock

@pytest.mark.asyncio
async def test_ticket_creation_and_filtering(mock_broadcast):
    # 1. Create a ticket
    request = TicketCreateRequest(
        order_name="Test Evacuation",
        type="Evacuation",
        department="NDRF",
        issued_by="Admin1",
        executed_by="NDRF Unit 1",
        source=TicketSource.workforce
    )
    
    ticket = await TicketService.ingest_event(request)
    
    # Check if broadcast was called
    mock_broadcast.assert_called_once_with(
        "TICKET_CREATED", ticket.model_dump(mode='json')
    )
    
    assert ticket.order_name == "Test Evacuation"
    assert ticket.status == TicketStatus.given
    
    # Add a second ticket
    request2 = TicketCreateRequest(
        order_name="Medical Supplies",
        type="Medical",
        department="EMS",
        issued_by="Admin1",
        executed_by="EMS Ambulance 3",
        source=TicketSource.twin_aggregator,
        status=TicketStatus.in_progress
    )
    ticket2 = await TicketService.ingest_event(request2)

    # 2. Filter by department
    ndrf_tickets = TicketService.get_tickets(department="NDRF")
    assert len(ndrf_tickets) == 1
    assert ndrf_tickets[0].id == ticket.id
    
    # Filter by type
    medical_tickets = TicketService.get_tickets(ticket_type="Medical")
    assert len(medical_tickets) == 1
    assert medical_tickets[0].id == ticket2.id
    
    # Filter by status
    in_progress = TicketService.get_tickets(status=TicketStatus.in_progress)
    assert len(in_progress) == 1
    assert in_progress[0].id == ticket2.id

@pytest.mark.asyncio
async def test_revert_order_success(mock_broadcast):
    # Create ticket
    request = TicketCreateRequest(
        order_name="Rescue Op",
        type="Rescue",
        department="SDRF",
        issued_by="Admin2",
        executed_by="SDRF Unit 2",
        source=TicketSource.workforce,
        status=TicketStatus.in_progress
    )
    ticket = await TicketService.ingest_event(request)
    
    mock_broadcast.reset_mock()
    
    # Revert ticket
    revert_req = RevertOrderRequest(revert_reason="Situation under control")
    reverted_ticket = await TicketService.revert_order(ticket.id, revert_req)
    
    assert reverted_ticket.status == TicketStatus.reverted
    assert reverted_ticket.revert_reason == "Situation under control"
    
    # Verify broadcast events
    assert mock_broadcast.call_count == 2
    
    # Call 1: ORDER_REVERTED_STOP
    call_args_stop = mock_broadcast.call_args_list[0][0]
    assert call_args_stop[0] == "ORDER_REVERTED_STOP"
    assert call_args_stop[1]["ticket_id"] == str(ticket.id)
    assert call_args_stop[1]["reason"] == "Situation under control"
    
    # Call 2: TICKET_UPDATED
    call_args_update = mock_broadcast.call_args_list[1][0]
    assert call_args_update[0] == "TICKET_UPDATED"
    assert call_args_update[1]["id"] == str(ticket.id)

@pytest.mark.asyncio
async def test_revert_order_rejection():
    # Create ticket and manually set to proceeded
    ticket_id = uuid4()
    tickets_db[ticket_id] = Ticket(
        id=ticket_id,
        order_name="Proceeded Op",
        type="Rescue",
        department="SDRF",
        status=TicketStatus.proceeded,
        issued_by="Admin",
        executed_by="SDRF",
        source=TicketSource.workforce
    )
    
    # Try reverting
    revert_req = RevertOrderRequest(revert_reason="Too late")
    with pytest.raises(HTTPException) as exc_info:
        await TicketService.revert_order(ticket_id, revert_req)
    
    assert exc_info.value.status_code == 400
    assert "Only orders with status 'given' or 'in_progress' can be reverted" in exc_info.value.detail

@pytest.mark.asyncio
async def test_inquiry_lifecycle_and_badge_count(mock_broadcast):
    ticket_id = uuid4()
    tickets_db[ticket_id] = Ticket(
        id=ticket_id,
        order_name="Inquiry Op",
        type="Rescue",
        department="SDRF",
        status=TicketStatus.in_progress,
        issued_by="Admin",
        executed_by="SDRF",
        source=TicketSource.workforce
    )
    
    # 1. Check initial badge count
    assert TicketService.get_pending_badge_count() == 0
    
    # 2. Submit Inquiry
    inquiry_req = InquiryCreateRequest(question="ETA?", asked_by="Admin3")
    inquiry = await TicketService.submit_inquiry(ticket_id, inquiry_req)
    
    assert inquiry.status == InquiryStatus.awaiting_response
    assert inquiry.question == "ETA?"
    assert TicketService.get_pending_badge_count() == 1
    
    # Check broadcast
    call_args_badge = mock_broadcast.call_args_list[-1][0]
    assert call_args_badge[0] == "BADGE_COUNT_UPDATED"
    assert call_args_badge[1]["pending_inquiries_count"] == 1
    
    mock_broadcast.reset_mock()
    
    # 3. Answer Inquiry
    answer_req = InquiryAnswerRequest(response="10 mins")
    answered = await TicketService.answer_inquiry(ticket_id, inquiry.id, answer_req)
    
    assert answered.status == InquiryStatus.answered
    assert answered.response == "10 mins"
    assert answered.answered_at is not None
    assert TicketService.get_pending_badge_count() == 0
    
    # Check broadcast
    call_args_badge = mock_broadcast.call_args_list[-1][0]
    assert call_args_badge[0] == "BADGE_COUNT_UPDATED"
    assert call_args_badge[1]["pending_inquiries_count"] == 0

@pytest.mark.asyncio
async def test_background_overdue_transition(mock_broadcast):
    # Setup overdue ticket inquiry manually
    ticket_id = uuid4()
    tickets_db[ticket_id] = Ticket(
        id=ticket_id, order_name="Overdue Op", type="Rescue", department="SDRF",
        status=TicketStatus.in_progress, issued_by="Admin", executed_by="SDRF",
        source=TicketSource.workforce
    )
    
    inquiry_id = uuid4()
    inquiries_db[inquiry_id] = TicketInquiry(
        id=inquiry_id,
        ticket_id=ticket_id,
        question="Status?",
        asked_by="Admin",
        status=InquiryStatus.awaiting_response,
        created_at=datetime.now(timezone.utc) - timedelta(minutes=20) # Overdue (Turnaround is 15m)
    )
    
    mock_broadcast.reset_mock()
    
    # Run the background check method once
    await TicketService.check_overdue_inquiries()
    
    # Verify it became overdue
    inquiry = inquiries_db[inquiry_id]
    assert inquiry.status == InquiryStatus.overdue
    
    # Verify broadcasts
    assert mock_broadcast.call_count == 2
    call_args_update = mock_broadcast.call_args_list[0][0]
    assert call_args_update[0] == "INQUIRY_UPDATED"
    assert call_args_update[1]["status"] == InquiryStatus.overdue.value
    
    call_args_badge = mock_broadcast.call_args_list[1][0]
    assert call_args_badge[0] == "BADGE_COUNT_UPDATED"
    assert call_args_badge[1]["pending_inquiries_count"] == 1 # Still pending
