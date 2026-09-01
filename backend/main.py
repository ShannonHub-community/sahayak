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
)
from services.donation_service.router import router as donation_router
from services.twin_aggregator.router import router as twin_aggregator_router
from services.ai_decision.router import router as ai_decision_router


app = FastAPI(
    title="Sahayak Disaster Management API",
    description="Unified multi-domain backend API for Citizen SOS, AI Command Center, EOC Operations, and Logistics Ledgers.",
    version="1.0.0",
)

# CORS Middleware allowing localhost frontend portals and mobile tunneling tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sahayak.com",
    ],
    allow_origin_regex=r"^https://.*\.ngrok-free\.app$|^https://.*\.ngrok\.io$|^https://.*\.loca\.lt$",
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
app.include_router(donation_router)


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