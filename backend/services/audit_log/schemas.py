from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ValidationInfo
from datetime import datetime, timezone
from uuid import UUID, uuid4

class TicketStatus(str, Enum):
    given = "given"
    in_progress = "in_progress"
    proceeded = "proceeded"
    reverted = "reverted"

class TicketSource(str, Enum):
    workforce = "workforce"
    twin_aggregator = "twin_aggregator"

class InquiryStatus(str, Enum):
    awaiting_response = "awaiting_response"
    answered = "answered"
    overdue = "overdue"

class TicketInquiry(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    ticket_id: UUID
    question: str
    response: Optional[str] = None
    asked_by: str
    status: InquiryStatus = InquiryStatus.awaiting_response
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    answered_at: Optional[datetime] = None

class Ticket(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    order_name: str
    type: str
    department: str
    status: TicketStatus
    issued_by: str
    executed_by: str
    source: TicketSource
    revert_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator('revert_reason')
    @classmethod
    def validate_revert_reason(cls, v: Optional[str], info: ValidationInfo) -> Optional[str]:
        if info.data.get('status') == TicketStatus.reverted and not v:
            raise ValueError('revert_reason must be provided when status is reverted')
        return v

class TicketCreateRequest(BaseModel):
    order_name: str
    type: str
    department: str
    status: TicketStatus = TicketStatus.given
    issued_by: str
    executed_by: str
    source: TicketSource

class TicketResponse(Ticket):
    inquiries: List[TicketInquiry] = []

class TicketFilterParams(BaseModel):
    department: Optional[str] = None
    type: Optional[str] = None
    status: Optional[TicketStatus] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class RevertOrderRequest(BaseModel):
    revert_reason: str

    @field_validator('revert_reason')
    @classmethod
    def revert_reason_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('revert_reason must not be empty')
        return v.strip()

class InquiryCreateRequest(BaseModel):
    question: str
    asked_by: str

class InquiryAnswerRequest(BaseModel):
    response: str

class BadgeCountResponse(BaseModel):
    pending_inquiries_count: int

class WebSocketEvent(BaseModel):
    event: str
    payload: Dict[str, Any]
