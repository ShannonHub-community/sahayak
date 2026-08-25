from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any, Dict


class TwinMapState(BaseModel):
    id: UUID
    entity_type: str
    location: Dict[str, Any]
    symbol: str
    severity_count: int
    status: str
    last_updated: datetime
