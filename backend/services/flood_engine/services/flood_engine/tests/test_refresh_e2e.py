import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import httpx
import pytest
import respx

from config import get_settings
from services.flood_engine import service
from services.flood_engine.tests.seed import seed_wards
from tests.fake_supabase import FakeSupabase


@pytest.fixture(autouse=True)
def isolated_model_path(tmp_path, monkeypatch):
    monkeypatch.setenv("FLOOD_MODEL_PATH", str(tmp_path / "flood_model.json"))
    get_settings.cache_clear()
    service.load_model.cache_clear()
    yield
    get_settings.cache_clear()
    service.load_model.cache_clear()


def _db():
    db = FakeSupabase()
    seed_wards(db)
    return db


def _mock_sources():
    settings = get_settings()
    respx.get(settings.open_meteo_base_url).mock(
        return_value=httpx.Response(200, json={"hourly": {"precipitation": [None, 30.0]}})
    )
    respx.get(f"{settings.cwc_base_url}/stations/STN-01/latest").mock(
        return_value=httpx.Response(200, json={"discharge_m3s": 200.0})
    )
    respx.get(f"{settings.cwc_base_url}/stations/STN-02/latest").mock(
        return_value=httpx.Response(200, json={"discharge_m3s": 90.0})
    )


def _flood_engine_tickets(db):
    return [t for t in db._tables["tickets"].rows if t.get("department") == "flood_engine"]


def test_run_refresh_full_chain_success():
    db = _db()
    with respx.mock:
        _mock_sources()
        result = asyncio.run(service.run_refresh(db, trigger_type="manual", triggered_by="ddma-1"))

    assert result.status == "success"
    assert result.wards_processed == 2
    assert result.wards_failed == 0
    assert len(result.scores) == 2
    assert all(0 <= s.score <= 100 for s in result.scores)

    assert len(db._tables["ward_readings"].rows) == 2
    assert len(db._tables["risk_scores"].rows) == 2

    for row in db._tables["risk_scores"].rows:
        assert row["run_type"] == "manual"
        assert "scored_at" in row
        assert "run_id" not in row

    for row in db._tables["ward_readings"].rows:
        assert set(row.keys()) <= {"id", "ward_id", "rainfall_mm", "discharge_m3s", "source", "fetched_at"}

    tickets = _flood_engine_tickets(db)
    assert len(tickets) == 1
    ticket = tickets[0]
    assert ticket["type"] == "flood_engine_refresh"
    assert ticket["source"] == "manual"
    assert ticket["issued_by"] == "ddma-1"
    assert ticket["status"] == "success"

    inquiries = [i for i in db._tables["ticket_inquiries"].rows if i["ticket_id"] == ticket["id"]]
    summary = [i for i in inquiries if i["question"] == "run summary"]
    assert len(summary) == 1
    assert "wards_processed=2" in summary[0]["response"]


def test_run_refresh_partial_failure_still_scores_healthy_wards():
    db = _db()
    settings = get_settings()
    with respx.mock:
        respx.get(settings.open_meteo_base_url).mock(
            return_value=httpx.Response(200, json={"hourly": {"precipitation": [None, 15.0]}})
        )
        respx.get(f"{settings.cwc_base_url}/stations/STN-01/latest").mock(
            return_value=httpx.Response(200, json={"discharge_m3s": 100.0})
        )
        respx.get(f"{settings.cwc_base_url}/stations/STN-02/latest").mock(
            return_value=httpx.Response(500)
        )
        result = asyncio.run(service.run_refresh(db, trigger_type="scheduled", triggered_by="scheduler"))

    assert result.wards_processed == 2

    failure_notes = [
        i for i in db._tables["ticket_inquiries"].rows
        if i["status"] == "failed" and "cwc" in i["question"]
    ]
    assert len(failure_notes) == 1
    assert "WARD-02" in failure_notes[0]["question"]

    ticket = _flood_engine_tickets(db)[0]
    assert ticket["source"] == "scheduled"


def test_run_refresh_no_wards_configured_marks_run_failed():
    db = FakeSupabase()
    with respx.mock:
        result = asyncio.run(service.run_refresh(db, trigger_type="manual", triggered_by="ddma-1"))

    assert result.status == "failed"
    assert result.wards_processed == 0
    ticket = _flood_engine_tickets(db)[0]
    assert ticket["status"] == "failed"
    assert ticket["revert_reason"] == "No wards found in ward_attributes"


def test_backtest_reuses_scoring_against_historical_readings_no_ingestion_calls():
    db = _db()
    with respx.mock:
        _mock_sources()
        asyncio.run(service.run_refresh(db, trigger_type="manual", triggered_by="ddma-1"))

    source_fetched_at = db._tables["ward_readings"].rows[0]["fetched_at"]

    backtest_result = service.run_backtest(db, source_fetched_at, triggered_by="ddma-2")

    assert backtest_result.trigger_type == "backtest"
    assert backtest_result.status == "success"
    assert backtest_result.wards_processed == 2

    backtest_tickets = [t for t in _flood_engine_tickets(db) if t["type"] == "flood_engine_backtest"]
    assert len(backtest_tickets) == 1
    assert source_fetched_at in backtest_tickets[0]["revert_reason"]

    assert len(db._tables["risk_scores"].rows) == 4
    backtest_scores = [r for r in db._tables["risk_scores"].rows if r["run_type"] == "backtest"]
    assert len(backtest_scores) == 2


def test_backtest_unknown_fetched_at_raises_value_error():
    db = _db()
    with pytest.raises(ValueError):
        service.run_backtest(db, "2000-01-01T00:00:00+00:00", triggered_by="ddma-1")


def test_get_latest_risk_scores_returns_most_recent_per_ward():
    db = _db()
    with respx.mock:
        _mock_sources()
        asyncio.run(service.run_refresh(db, trigger_type="manual", triggered_by="ddma-1"))
        asyncio.run(service.run_refresh(db, trigger_type="manual", triggered_by="ddma-1"))

    latest = service.get_latest_risk_scores(db)
    ward_ids = {s.ward_id for s in latest}
    assert ward_ids == {"WARD-01", "WARD-02"}
    assert len(latest) == 2
    for s in latest:
        assert s.run_id == "manual"
        assert s.flagged is False
