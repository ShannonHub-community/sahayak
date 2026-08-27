import logging

from fastapi import APIRouter, HTTPException

from database.supabase_client import get_supabase
from services.flood_engine.schemas import RefreshRequest, BacktestRequest, RefreshResponse
from services.flood_engine import service

logger = logging.getLogger("flood_engine.router")
router = APIRouter(prefix="/flood-engine", tags=["flood-engine"])


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(payload: RefreshRequest):
    """
    Runs Ingestion -> Feature Engineering -> Scoring. Called directly by
    both the Scheduled Refresh (every 3-6 hrs, trigger_type='scheduled')
    and Manual Refresh (DDMA-triggered, trigger_type='manual').
    """
    supabase = get_supabase()
    try:
        return await service.run_refresh(supabase, payload.trigger_type, payload.triggered_by)
    except service.FeatureSchemaError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/backtest", response_model=RefreshResponse)
async def backtest(payload: BacktestRequest):
    """
    Reuses Feature Engineering + Scoring against a historical `ward_readings`
    run already in the database — no Ingestion API calls.
    """
    supabase = get_supabase()
    try:
        return service.run_backtest(supabase, payload.run_id, payload.triggered_by)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except service.FeatureSchemaError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/risk-scores/latest")
def latest_risk_scores():
    """Most recent risk score per ward — feeds the Command Dashboard
    heatmap and AI Resource Allocation Optimizer."""
    supabase = get_supabase()
    return service.get_latest_risk_scores(supabase)


@router.get("/audit-log")
def audit_log(limit: int = 20):
    supabase = get_supabase()
    return service.get_audit_log(supabase, limit=limit)
