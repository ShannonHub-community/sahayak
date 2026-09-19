"""
Local SQLite database setup using SQLAlchemy.
Provides persistent storage for News Alerts and Audit Logs.
"""
import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Generator, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------------------------
# Database URL & Engine Configuration
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "sahayak_local.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---------------------------------------------------------------------------
# SQLAlchemy Models
# ---------------------------------------------------------------------------
class NewsAlert(Base):
    """SQLAlchemy model for News Alerts and Public Bulletins."""
    __tablename__ = "news_alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, default="info")
    status = Column(String(50), nullable=False, default="active")
    created_by = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)
    timestamp = Column(String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return {
            "alert_id": self.alert_id,
            "title": self.title,
            "message": self.message,
            "severity": self.severity,
            "status": self.status,
            "created_by": self.created_by,
            "state": self.state,
            "timestamp": self.timestamp,
            "updated_at": self.updated_at,
        }


class AuditRecord(Base):
    """SQLAlchemy model for Audit Tickets / Operational Log Orders."""
    __tablename__ = "audit_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    order_name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    department = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="given")
    issued_by = Column(String(255), nullable=False)
    executed_by = Column(String(255), nullable=False)
    source = Column(String(100), nullable=False)
    revert_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "order_name": self.order_name,
            "type": self.type,
            "department": self.department,
            "status": self.status,
            "issued_by": self.issued_by,
            "executed_by": self.executed_by,
            "source": self.source,
            "revert_reason": self.revert_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_schema(self):
        from services.audit_log.schemas import Ticket, TicketStatus, TicketSource
        c_at = self.created_at
        if c_at and c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
        u_at = self.updated_at
        if u_at and u_at.tzinfo is None:
            u_at = u_at.replace(tzinfo=timezone.utc)

        return Ticket(
            id=UUID(self.id),
            order_name=self.order_name,
            type=self.type,
            department=self.department,
            status=TicketStatus(self.status),
            issued_by=self.issued_by,
            executed_by=self.executed_by,
            source=TicketSource(self.source),
            revert_reason=self.revert_reason,
            created_at=c_at or datetime.now(timezone.utc),
            updated_at=u_at or datetime.now(timezone.utc),
        )


# Alias for backward compatibility
TicketRecord = AuditRecord


class InquiryRecord(Base):
    """SQLAlchemy model for Ticket Inquiries and Clarifications."""
    __tablename__ = "audit_inquiries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ticket_id = Column(String(36), nullable=False, index=True)
    question = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    asked_by = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="awaiting_response")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    answered_at = Column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "question": self.question,
            "response": self.response,
            "asked_by": self.asked_by,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "answered_at": self.answered_at.isoformat() if self.answered_at else None,
        }

    def to_schema(self):
        from services.audit_log.schemas import TicketInquiry, InquiryStatus
        c_at = self.created_at
        if c_at and c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
        a_at = self.answered_at
        if a_at and a_at.tzinfo is None:
            a_at = a_at.replace(tzinfo=timezone.utc)

        return TicketInquiry(
            id=UUID(self.id),
            ticket_id=UUID(self.ticket_id),
            question=self.question,
            response=self.response,
            asked_by=self.asked_by,
            status=InquiryStatus(self.status),
            created_at=c_at or datetime.now(timezone.utc),
            answered_at=a_at,
        )


# ---------------------------------------------------------------------------
# Database Session Helpers
# ---------------------------------------------------------------------------
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Context manager for SQLAlchemy session lifecycle."""
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database sessions."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Initial Seed Data
# ---------------------------------------------------------------------------
DEFAULT_NEWS_ALERTS = [
    {
        "alert_id": 1,
        "title": "RED ALERT: Morbe Dam Secondary Spillway Gate 2 Opening",
        "message": "Water levels at Morbe Reservoir have exceeded 88.4m FSL. Controlled discharge of 4,800 cusecs commenced into Patalganga basin. All riverine communities must evacuate to designated relief camps immediately.",
        "severity": "critical",
        "status": "active",
        "created_by": "State Disaster Management Authority / CWC",
        "state": "Maharashtra",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 2,
        "title": "EVACUATION NOTICE: Sector 4 Roha Low-Lying Wards",
        "message": "Waterlogging depth exceeding 1.2m near Roha Railway Station and Bazar Peth. 45 NDRF personnel and motorized rescue boats deployed. Evacuees proceed towards Zilla Parishad School Shelter.",
        "severity": "critical",
        "status": "active",
        "created_by": "Raigad District Disaster Operations",
        "state": "Maharashtra",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 3,
        "title": "FLASH FLOOD WATCH: Panvel-Pen Highway Inundation",
        "message": "NH-66 submerged between km 42 and km 48. Heavy vehicular transit suspended. Light rescue ambulances prioritized along high-ground bypass.",
        "severity": "warning",
        "status": "active",
        "created_by": "Highway Traffic Police & EOC",
        "state": "Maharashtra",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 4,
        "title": "RELIEF ADVISORY: Clean Drinking Water Distribution",
        "message": "Packaged mineral water and ORS packets available at Panvel Community Shelter A and Pen Town Hall. Medical teams stationed for water-borne pathogen screening.",
        "severity": "info",
        "status": "active",
        "created_by": "Public Health Department",
        "state": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 5,
        "title": "DAM SLUICE GATE DISCHARGE: Krishna River Basin Spillways",
        "message": "Due to continuous heavy catchment rainfall, 4 spillway gates at Almatti and Narayanpur dams have been opened discharging 1,45,000 cusecs. Residents along low-lying riverbanks must move to designated higher ground shelters immediately.",
        "severity": "critical",
        "status": "active",
        "created_by": "Central Water Commission & Karnataka SDRF",
        "state": "Karnataka",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 6,
        "title": "FLOOD WARNING: Yamuna River Exceeds Evacuation Mark",
        "message": "Water levels at Old Railway Bridge have risen past 206.0m due to heavy discharge from Hathnikund Barrage. Inhabitants of low-lying floodplains in East and North East Delhi must relocate to designated community relief tents immediately.",
        "severity": "warning",
        "status": "active",
        "created_by": "Delhi Disaster Management Authority (DDMA)",
        "state": "Delhi",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 7,
        "title": "COASTAL INUNDATION ADVISORY: Heavy Rain & Sea Surge Warning",
        "message": "IMD Chennai issues Orange Alert warning of isolated heavy to very heavy rainfall over coastal districts. Emergency relief shelters operational across Greater Chennai Corporation and Cuddalore riverine areas.",
        "severity": "warning",
        "status": "active",
        "created_by": "Tamil Nadu State Disaster Management Authority (TNSDMA)",
        "state": "Tamil Nadu",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 8,
        "title": "TIDAL SURGE ALERT: Sundarbans Coastal Embankment Vigilance",
        "message": "High spring tides combined with deep depression in the Bay of Bengal. Civil defence volunteers deployed along vulnerable earthen river embankments in Kakdwip, Gosaba, and Sagar Island. Fishermen advised not to venture into deep sea.",
        "severity": "info",
        "status": "active",
        "created_by": "West Bengal Department of Disaster Management",
        "state": "West Bengal",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
]


def seed_initial_data(session: Session, force: bool = False):
    """Seed default records if tables are empty or force=True."""
    # 1. Seed News Alerts
    if force or session.query(NewsAlert).count() == 0:
        for alert_data in DEFAULT_NEWS_ALERTS:
            if not session.query(NewsAlert).filter(NewsAlert.alert_id == alert_data["alert_id"]).first():
                alert = NewsAlert(
                    alert_id=alert_data["alert_id"],
                    title=alert_data["title"],
                    message=alert_data["message"],
                    severity=alert_data["severity"],
                    status=alert_data["status"],
                    created_by=alert_data["created_by"],
                    state=alert_data["state"],
                    timestamp=alert_data["timestamp"],
                    updated_at=alert_data["updated_at"],
                )
                session.add(alert)
        session.commit()

    # 2. Seed Audit Tickets and Inquiries
    if force or session.query(AuditRecord).count() == 0:
        now = datetime.now(timezone.utc)
        t1_id = "11111111-1111-1111-1111-111111111111"
        if not session.query(AuditRecord).filter(AuditRecord.id == t1_id).first():
            t1 = AuditRecord(
                id=t1_id,
                order_name="NDRF Swift Water Rescue Team Deployment - Roha Sector 4",
                type="dispatch",
                department="Disaster Response / NDRF Unit 5",
                status="in_progress",
                issued_by="EOC Incident Commander (Raigad Grid)",
                executed_by="Inspector Rajesh Shinde",
                source="workforce",
                created_at=now - timedelta(minutes=24),
                updated_at=now - timedelta(minutes=15),
            )
            session.add(t1)

        inq1_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        if not session.query(InquiryRecord).filter(InquiryRecord.id == inq1_id).first():
            inq1 = InquiryRecord(
                id=inq1_id,
                ticket_id=t1_id,
                question="Have all 6 inflatable rescue boats cleared the railway bridge choke point?",
                asked_by="Logistics Coordinator",
                response="Yes, 4 boats operational at Sector 4, 2 staged at Zilla Parishad school.",
                status="answered",
                created_at=now - timedelta(minutes=18),
                answered_at=now - timedelta(minutes=12),
            )
            session.add(inq1)

        t2_id = "22222222-2222-2222-2222-222222222222"
        if not session.query(AuditRecord).filter(AuditRecord.id == t2_id).first():
            t2 = AuditRecord(
                id=t2_id,
                order_name="Emergency Insulin & Dialysis Supply Induction - Panvel Camp",
                type="procurement",
                department="Public Health / Civil Hospital",
                status="given",
                issued_by="Chief Medical Officer",
                executed_by="Dr. Suresh Patil (IMA)",
                source="workforce",
                created_at=now - timedelta(minutes=45),
                updated_at=now - timedelta(minutes=30),
            )
            session.add(t2)

        t3_id = "33333333-3333-3333-3333-333333333333"
        if not session.query(AuditRecord).filter(AuditRecord.id == t3_id).first():
            t3 = AuditRecord(
                id=t3_id,
                order_name="Secondary Flood Gate Discharge Notification - Morbe Dam",
                type="advisory",
                department="Central Water Commission & Irrigation Dept",
                status="given",
                issued_by="Dam Safety Chief Engineer",
                executed_by="Flood Warning Cell",
                source="twin_aggregator",
                created_at=now - timedelta(minutes=10),
                updated_at=now - timedelta(minutes=8),
            )
            session.add(t3)

        inq3_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        if not session.query(InquiryRecord).filter(InquiryRecord.id == inq3_id).first():
            inq3 = InquiryRecord(
                id=inq3_id,
                ticket_id=t3_id,
                question="Confirm siren activation in down-river villages prior to 5,000 cusec release?",
                asked_by="State Disaster Management Authority",
                status="awaiting_response",
                created_at=now - timedelta(minutes=5),
            )
            session.add(inq3)
        session.commit()


# ---------------------------------------------------------------------------
# Database Initialization Routine
# ---------------------------------------------------------------------------
def init_db(force: bool = False):
    """Initializes tables and seeds baseline data on startup."""
    Base.metadata.create_all(bind=engine)
    with get_db_session() as session:
        seed_initial_data(session, force=force)


# Automatically ensure tables exist upon module import
init_db()
