"""
SAHAYAK Disaster Management & Emergency Response Platform
Main FastAPI Backend Gateway Application
"""
import os
from dotenv import load_dotenv

# Load .env from backend/ dir or project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Domain Routers
from routers.citizen_router import router as citizen_ivr_router
from services.sos_service.router import router as sos_router
from services.registration_service.router import (
    citizen_router,
    registration_router,
    sos_autofill_router,
)
from services.audit_log.router import router as audit_log_router
from services.resource_service.router import router as resource_router
from services.news_report.router import (
    news_report_router,
    public_feed_router,
    geo_router,
)
from services.donation_service.router import router as donation_router
from services.twin_aggregator.router import router as twin_aggregator_router
from services.ai_decision.router import router as ai_decision_router
from services.workforce_orchestrator.main import app as workforce_app
from services.pdna_service.main import app as pdna_app


from database.local_sqlite import init_db

app = FastAPI(
    title="Sahayak Disaster Management API",
    description="Unified API Gateway and micro-service mesh for Sahayak Disaster Management Ecosystem",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    init_db()

allowed_origin_regex = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"^https://.*\.ngrok-free\.app$|^https://.*\.ngrok-free\.dev$|^https://.*\.ngrok\.app$|^https://.*\.ngrok\.io$|^https://.*\.loca\.lt$|^https://.*\.onrender\.com$",
)

# CORS Middleware allowing localhost frontend portals and mobile tunneling tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sahayak.com",
        "https://sahayak-frontend.onrender.com",
    ],
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Router Inclusions across all Domains
# ---------------------------------------------------------------------------

# Domain 1: Citizen SOS, Pre-Registration, Autofill, and IVR Telephony
app.include_router(sos_router)
app.include_router(citizen_router)
app.include_router(citizen_ivr_router)
app.include_router(registration_router)
app.include_router(sos_autofill_router)

# Domain 2: AI Command Center & GIS Digital Twin
app.include_router(ai_decision_router)
app.include_router(twin_aggregator_router)

# Domain 3: EOC Operations, Audit Log, Resources, Comms & Donations
app.include_router(audit_log_router)
app.include_router(
    resource_router,
    prefix="/api/v1/resources",
    tags=["Resource & Shelter Ledger"],
)
app.include_router(news_report_router)
app.include_router(public_feed_router)
app.include_router(geo_router)
app.include_router(donation_router)
app.include_router(workforce_app.router, tags=["Workforce Orchestrator"])

# Domain 4: Post-Disaster Needs Assessment (PDNA)
app.include_router(pdna_app.router, tags=["Post-Disaster Needs Assessment (PDNA)"])


# ---------------------------------------------------------------------------
# System Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "sahayak-unified-api",
        "version": "1.0.0",
        "domains": [
            "citizen-sos",
            "citizen-registration",
            "ai-decision",
            "twin-aggregator",
            "audit-log",
            "resource-manager",
            "public-comms",
            "donation-coordinator",
        ],
    }


# ---------------------------------------------------------------------------
# Entry Point — binds to Render's dynamic $PORT (defaults to 8000 locally)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)