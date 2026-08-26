from fastapi import FastAPI

from services.sos_service.router import router as sos_router
from services.resource_service.router import router as resource_router


app = FastAPI(
    title="Sahayak API",
    description="Backend API for the Sahayak disaster management platform.",
    version="0.1.0",
)


app.include_router(sos_router)
app.include_router(
    resource_router,
    prefix="/api/v1/resources",
    tags=["Resource Manager"]
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sahayak-api"}