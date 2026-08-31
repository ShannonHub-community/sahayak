"""
SOS Service API routes.

    POST /api/sos
    POST /api/v1/citizen/sos
"""
from fastapi import APIRouter

from services.sos_service import service
from services.sos_service.schemas import SOSSubmitRequest, SOSSubmitResponse

router = APIRouter(tags=["sos"])
sos_submit_router = router


@router.post("/api/sos", response_model=SOSSubmitResponse)
@router.post("/api/v1/citizen/sos", response_model=SOSSubmitResponse)
def submit_sos(req: SOSSubmitRequest):
    return service.submit_sos(req)
