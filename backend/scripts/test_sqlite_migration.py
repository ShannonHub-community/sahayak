"""
Verification script for SQLite Migration of News Report and Audit Log services.
Tests CRUD operations and verifies persistence in sahayak_local.db.
"""
import asyncio
import os
import sys
from uuid import UUID

# Ensure backend root is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database.local_sqlite import (
    DB_PATH,
    SessionLocal,
    NewsAlert,
    AuditRecord,
    InquiryRecord,
    init_db,
)
from services.news_report.schemas import AlertCreateRequest, AlertUpdateRequest
from services.news_report import service as news_service
from services.audit_log.schemas import (
    TicketCreateRequest,
    TicketSource,
    TicketStatus,
    RevertOrderRequest,
    InquiryCreateRequest,
    InquiryAnswerRequest,
)
from services.audit_log.service import TicketService


async def run_verification():
    print("=" * 60)
    print("1. VERIFYING DATABASE FILE & INITIALIZATION")
    print("=" * 60)
    init_db(force=True)
    assert os.path.exists(DB_PATH), f"Database file {DB_PATH} does not exist!"
    print(f"Database successfully found at: {DB_PATH}")

    with SessionLocal() as session:
        initial_alerts_count = session.query(NewsAlert).count()
        initial_tickets_count = session.query(AuditRecord).count()
        print(f"Pre-seeded News Alerts in DB: {initial_alerts_count}")
        print(f"Pre-seeded Audit Tickets in DB: {initial_tickets_count}")
        assert initial_alerts_count >= 8, f"Expected >= 8 alerts, got {initial_alerts_count}"
        assert initial_tickets_count >= 3, f"Expected >= 3 tickets, got {initial_tickets_count}"

    print("\n" + "=" * 60)
    print("2. TESTING NEWS ALERT CRUD OPERATIONS")
    print("=" * 60)

    # 2a. Create Alert
    req = AlertCreateRequest(
        title="TEST SQLite Migration Alert",
        message="Verification message testing persistent SQLite storage.",
        severity="warning",
        created_by="Automated Test Suite",
        state="Maharashtra",
    )
    created = news_service.create_alert(req)
    alert_id = created["alert_id"]
    print(f"Created News Alert with ID {alert_id}: {created['title']}")
    assert created["title"] == "TEST SQLite Migration Alert"
    assert created["status"] == "active"

    # 2b. Read Alert
    fetched = news_service.get_alert(alert_id)
    assert fetched["alert_id"] == alert_id
    assert fetched["message"] == "Verification message testing persistent SQLite storage."
    print(f"Successfully fetched News Alert {alert_id}")

    # 2c. Update Alert
    update_req = AlertUpdateRequest(
        title="TEST SQLite Migration Alert - UPDATED",
        severity="critical",
    )
    updated = news_service.update_alert(alert_id, update_req)
    assert updated["title"] == "TEST SQLite Migration Alert - UPDATED"
    assert updated["severity"] == "critical"
    print(f"Successfully updated News Alert {alert_id} severity to critical")

    # 2d. List Alerts & Public Feed
    alerts_list = news_service.list_alerts(status="active", page=1, page_size=10)
    assert any(a["alert_id"] == alert_id for a in alerts_list)
    print(f"Listed {len(alerts_list)} active alerts, newly created alert confirmed present.")

    feed = news_service.get_public_feed(state="Maharashtra")
    assert any(a["alert_id"] == alert_id for a in feed["alerts"])
    print(f"Public feed for Maharashtra returned {feed['count']} alerts matching filter.")

    print("\n" + "=" * 60)
    print("3. TESTING AUDIT LOG / TICKET CRUD OPERATIONS")
    print("=" * 60)

    # 3a. Ingest Ticket
    ticket_req = TicketCreateRequest(
        order_name="Deploy Secondary Drainage Pumps at Kalamboli Junction",
        type="dispatch",
        department="Municipal Public Works",
        status=TicketStatus.in_progress,
        issued_by="Chief Engineer PWD",
        executed_by="Station Officer Kamothe",
        source=TicketSource.workforce,
    )
    ticket = await TicketService.ingest_event(ticket_req)
    ticket_id = ticket.id
    print(f"Ingested Ticket {ticket_id}: {ticket.order_name}")

    # 3b. Read Ticket
    read_ticket = TicketService.get_ticket(ticket_id)
    assert read_ticket is not None
    assert read_ticket.id == ticket_id
    assert read_ticket.department == "Municipal Public Works"
    print(f"Successfully retrieved Ticket {ticket_id}")

    # 3c. Submit Inquiry
    inquiry_req = InquiryCreateRequest(
        question="Have heavy diesel pumps arrived at the site?",
        asked_by="Logistics Coordinator",
    )
    inquiry = await TicketService.submit_inquiry(ticket_id, inquiry_req)
    inquiry_id = inquiry.id
    print(f"Submitted Inquiry {inquiry_id}: {inquiry.question}")

    # 3d. Check inquiries and badge count
    inquiries = TicketService.get_ticket_inquiries(ticket_id)
    assert any(i.id == inquiry_id for i in inquiries)
    badge_count = TicketService.get_pending_badge_count()
    print(f"Ticket has {len(inquiries)} inquiries. Current pending badge count: {badge_count}")

    # 3e. Answer Inquiry
    answer_req = InquiryAnswerRequest(
        response="Yes, 3 high-capacity diesel pumps operational on site."
    )
    answered_inq = await TicketService.answer_inquiry(ticket_id, inquiry_id, answer_req)
    assert answered_inq.status.value == "answered"
    assert answered_inq.response == answer_req.response
    print(f"Answered Inquiry {inquiry_id}: Status={answered_inq.status.value}")

    # 3f. Revert Order
    revert_req = RevertOrderRequest(
        revert_reason="Water level receded, mobile pumps diverted to Sector 6."
    )
    reverted_ticket = await TicketService.revert_order(ticket_id, revert_req)
    assert reverted_ticket.status.value == "reverted"
    assert reverted_ticket.revert_reason == revert_req.revert_reason
    print(f"Successfully reverted Ticket {ticket_id} with reason: {reverted_ticket.revert_reason}")

    print("\n" + "=" * 60)
    print("4. VERIFYING DISK PERSISTENCE IN RAW SQLITE SESSION")
    print("=" * 60)
    with SessionLocal() as verify_session:
        db_alert = verify_session.query(NewsAlert).filter(NewsAlert.alert_id == alert_id).first()
        assert db_alert is not None
        assert db_alert.title == "TEST SQLite Migration Alert - UPDATED"

        db_ticket = verify_session.query(AuditRecord).filter(AuditRecord.id == str(ticket_id)).first()
        assert db_ticket is not None
        assert db_ticket.status == "reverted"

        db_inquiry = verify_session.query(InquiryRecord).filter(InquiryRecord.id == str(inquiry_id)).first()
        assert db_inquiry is not None
        assert db_inquiry.status == "answered"
        assert db_inquiry.response == "Yes, 3 high-capacity diesel pumps operational on site."

        print("DISK VERIFICATION SUCCESSFUL: All created and updated records found directly in SQLite database!")

    print("\n" + "=" * 60)
    print("ALL VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_verification())
