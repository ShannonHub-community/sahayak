"""
SOS Service API routes.

    POST /api/sos
"""
from fastapi import APIRouter

from services.sos_service import service
from services.sos_service.schemas import SOSSubmitRequest, SOSSubmitResponse

router = APIRouter(prefix="/api/sos", tags=["sos"])
sos_submit_router = router


@router.post("", response_model=SOSSubmitResponse)
def submit_sos(req: SOSSubmitRequest):
    return service.submit_sos(req)
