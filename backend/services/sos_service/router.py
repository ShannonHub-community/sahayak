"""
SOS Service API routes.

    POST /api/sos
"""
from fastapi import APIRouter

import service
from schemas import SOSSubmitRequest, SOSSubmitResponse

sos_submit_router = APIRouter(prefix="/api/sos", tags=["sos"])


@sos_submit_router.post("", response_model=SOSSubmitResponse)
def submit_sos(req: SOSSubmitRequest):
    return service.submit_sos(req)
