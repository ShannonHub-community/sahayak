from fastapi import APIRouter


router = APIRouter(
    prefix="/api/sos",
    tags=["SOS"],
)


@router.get("/health")
async def sos_health():
    return {"status": "ok", "service": "sos"}
