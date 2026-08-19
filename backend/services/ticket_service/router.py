from fastapi import APIRouter


router = APIRouter(
    prefix="/api/ticket_service",
    tags=["ticket_service"],
)
