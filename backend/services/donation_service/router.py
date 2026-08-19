from fastapi import APIRouter


router = APIRouter(
    prefix="/api/donation_service",
    tags=["donation_service"],
)
