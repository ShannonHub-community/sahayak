"""
Tests for the three Live Updates additions from Prompt 6:
    1. Translation endpoint (POST /api/comms/translate)
    2. Text-to-speech endpoint (POST /api/comms/tts)
    3. GPS -> state lookup + state-filtered public feed

Sarvam calls are monkeypatched out - these tests check our own routing,
validation, fallback, and DB-filtering logic, not the third-party API.

Run with: PYTHONPATH=<repo root> pytest backend/services/news_report/tests
(assumes `backend.shared.database.get_db` is importable, i.e. these tests
run inside the full project, not this module in isolation).
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.services.news_report import cloud_tts_fallback, service
from backend.services.news_report.router import geo_router, news_report_router, public_feed_router


@pytest.fixture()
def client():
    app = FastAPI()
    app.include_router(news_report_router)
    app.include_router(public_feed_router)
    app.include_router(geo_router)
    return TestClient(app)


@pytest.fixture(autouse=True)
def _reset_state_column_flag():
    # _ensure_state_column() only runs its ALTER TABLE once per process;
    # reset the flag between tests so each test's fresh in-memory/temp DB
    # (provided by the project's own get_db fixture/conftest) still gets it.
    service._state_column_ensured = False
    yield


# ---------------------------------------------------------------------
# 1. Translation
# ---------------------------------------------------------------------
def test_translate_english_is_passthrough(client):
    resp = client.post(
        "/api/comms/translate",
        json={"language": "en", "items": [{"id": "1", "title": "Flood warning", "message": "Heavy rain"}]},
    )
    assert resp.status_code == 200
    assert resp.json() == {"items": [{"id": "1", "title": "Flood warning", "message": "Heavy rain"}]}


def test_translate_rejects_unsupported_language(client):
    resp = client.post(
        "/api/comms/translate",
        json={"language": "fr", "items": [{"id": "1", "title": "a", "message": "b"}]},
    )
    assert resp.status_code == 422


def test_translate_calls_sarvam_and_returns_translated_text(client, monkeypatch):
    def fake_translate_text(text, target_language_code, source_language_code="en-IN"):
        return f"[{target_language_code}] {text}"

    monkeypatch.setattr(service.cloud_tts_fallback, "translate_text", fake_translate_text)

    resp = client.post(
        "/api/comms/translate",
        json={"language": "hi", "items": [{"id": "1", "title": "Flood warning", "message": "Heavy rain"}]},
    )
    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert item["id"] == "1"
    assert item["title"] == "[hi-IN] Flood warning"
    assert item["message"] == "[hi-IN] Heavy rain"


def test_translate_falls_back_to_original_text_on_sarvam_failure(client, monkeypatch):
    def raising_translate_text(*args, **kwargs):
        raise service.cloud_tts_fallback.CloudTTSAPIError("boom")

    monkeypatch.setattr(service.cloud_tts_fallback, "translate_text", raising_translate_text)

    resp = client.post(
        "/api/comms/translate",
        json={"language": "hi", "items": [{"id": "1", "title": "Flood warning", "message": "Heavy rain"}]},
    )
    # Never a broken/empty card - falls back to original text, still 200.
    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert item["title"] == "Flood warning"
    assert item["message"] == "Heavy rain"


# ---------------------------------------------------------------------
# 2. Text-to-speech
# ---------------------------------------------------------------------
def test_tts_returns_audio_bytes_on_success(client, monkeypatch):
    monkeypatch.setattr(service.cloud_tts_fallback, "synthesize_speech", lambda text, lang: b"FAKE_AUDIO_BYTES")

    resp = client.post("/api/comms/tts", json={"text": "Flood warning", "language": "hi"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    assert resp.content == b"FAKE_AUDIO_BYTES"


def test_tts_returns_502_on_sarvam_failure(client, monkeypatch):
    def raising_synthesize(*args, **kwargs):
        raise service.cloud_tts_fallback.CloudTTSAPIError("tts backend down")

    monkeypatch.setattr(service.cloud_tts_fallback, "synthesize_speech", raising_synthesize)

    resp = client.post("/api/comms/tts", json={"text": "Flood warning", "language": "hi"})
    assert resp.status_code == 502
    assert "unavailable" in resp.json()["detail"]


def test_tts_defaults_to_english_when_no_language_selected(client, monkeypatch):
    seen = {}

    def fake_synthesize(text, target_language_code):
        seen["language"] = target_language_code
        return b"AUDIO"

    monkeypatch.setattr(service.cloud_tts_fallback, "synthesize_speech", fake_synthesize)

    resp = client.post("/api/comms/tts", json={"text": "Flood warning"})
    assert resp.status_code == 200
    assert seen["language"] == "en-IN"


# ---------------------------------------------------------------------
# 3. GPS -> state lookup + state-filtered feed
# ---------------------------------------------------------------------
def test_state_lookup_known_city(client):
    resp = client.post("/api/geo/state-lookup", json={"lat": 19.076, "lng": 72.8777})
    assert resp.status_code == 200
    assert resp.json() == {"state": "Maharashtra"}


def test_state_lookup_outside_india_returns_none(client):
    resp = client.post("/api/geo/state-lookup", json={"lat": 51.5074, "lng": -0.1278})
    assert resp.status_code == 200
    assert resp.json() == {"state": None}


def test_state_lookup_rejects_out_of_range_coordinates(client):
    resp = client.post("/api/geo/state-lookup", json={"lat": 999, "lng": 0})
    assert resp.status_code == 422


def test_public_feed_state_filter_includes_nationwide_and_matching_state_alerts(client):
    client.post("/api/news-report/alerts", json={"title": "Nationwide alert", "message": "m", "severity": "info"})
    client.post(
        "/api/news-report/alerts",
        json={"title": "Maharashtra only", "message": "m", "severity": "info", "state": "Maharashtra"},
    )
    client.post(
        "/api/news-report/alerts",
        json={"title": "Kerala only", "message": "m", "severity": "info", "state": "Kerala"},
    )

    resp = client.get("/api/comms/public-feed", params={"state": "Maharashtra"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["state_filter"] == "Maharashtra"
    titles = {a["title"] for a in body["alerts"]}
    assert "Nationwide alert" in titles
    assert "Maharashtra only" in titles
    assert "Kerala only" not in titles


def test_public_feed_without_state_param_is_unfiltered(client):
    client.post("/api/news-report/alerts", json={"title": "Nationwide alert", "message": "m", "severity": "info"})
    client.post(
        "/api/news-report/alerts",
        json={"title": "Kerala only", "message": "m", "severity": "info", "state": "Kerala"},
    )

    resp = client.get("/api/comms/public-feed")
    assert resp.status_code == 200
    body = resp.json()
    assert body["state_filter"] is None
    titles = {a["title"] for a in body["alerts"]}
    assert "Nationwide alert" in titles
    assert "Kerala only" in titles
