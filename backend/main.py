import os
from dotenv import load_dotenv

# Load .env from backend/ dir or project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.sos_service.router import router as sos_router
<<<<<<< HEAD
from services.resource_service.router import router as resource_router
=======
from services.twin_aggregator.router import router as twin_aggregator_router
>>>>>>> e9b0053add8f0b69e7986d982dbab1e3cdd9079a

print(f"DEBUG: SUPABASE_URL = {os.getenv('SUPABASE_URL')}")

app = FastAPI(
    title="Sahayak API",
    description="Backend API for the Sahayak disaster management platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    # REMOVED the "*" to strictly allow localhost credentials
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(sos_router)
<<<<<<< HEAD
app.include_router(
    resource_router,
    prefix="/api/v1/resources",
    tags=["Resource Manager"]
)
=======
app.include_router(twin_aggregator_router)
>>>>>>> e9b0053add8f0b69e7986d982dbab1e3cdd9079a


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sahayak-api"}