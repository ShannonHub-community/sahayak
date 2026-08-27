import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import pytest

from config import get_settings
from services.flood_engine import service
from services.flood_engine.schemas import FeatureVector
from tests.fake_supabase import FakeSupabase


@pytest.fixture(autouse=True)
def isolated_model_path(tmp_path, monkeypatch):
    """Points the model path at a scratch file per test so bootstrap
    behaviour is exercised fresh and tests never touch the real committed
    model artifact."""
    model_path = tmp_path / "flood_model.json"
    monkeypatch.setenv("FLOOD_MODEL_PATH", str(model_path))
    get_settings.cache_clear()
    service.load_model.cache_clear()
    yield
    get_settings.cache_clear()
    service.load_model.cache_clear()


def _feature(**overrides):
    base = dict(
        ward_id="WARD-01", rainfall_mm=50.0, rainfall_accum_window=80.0,
        discharge_m3s=200.0, discharge_trend=10.0, elevation_m=10.0, slope=2.0,
        drainage_density=1.5, historical_flood_count=3, drainage_adjusted_rainfall=20.0,
    )
    base.update(overrides)
    return FeatureVector(**base)


def test_load_model_bootstraps_when_missing():
    settings = get_settings()
    path = Path(settings.flood_model_path)
    assert not path.exists()

    booster = service.load_model()

    assert booster is not None
    assert path.exists()  # bootstrap persisted the fallback model


def test_load_model_reuses_existing_file_on_second_call():
    booster1 = service.load_model()
    service.load_model.cache_clear()
    booster2 = service.load_model()  # should load from disk, not re-bootstrap
    assert booster1 is not None and booster2 is not None


def test_score_wards_output_is_clipped_0_to_100():
    features = [_feature(ward_id=f"WARD-{i:02d}") for i in range(5)]
    scores = service.score_wards(features, run_id="run-1")

    assert len(scores) == 5
    for s in scores:
        assert 0.0 <= s.score <= 100.0
        assert s.run_id == "run-1"
        assert s.model_version == get_settings().flood_model_version


def test_score_wards_flags_out_of_training_range_feature():
    # rainfall_mm's expected training range is (0, 300) — 5000 is absurd
    features = [_feature(rainfall_mm=5000.0)]
    scores = service.score_wards(features, run_id="run-2")

    assert scores[0].flagged is True
    assert "rainfall_mm" in scores[0].flag_reason


def test_score_wards_does_not_flag_in_range_features():
    features = [_feature()]  # all within FEATURE_TRAINING_RANGES
    scores = service.score_wards(features, run_id="run-3")
    assert scores[0].flagged is False
    assert scores[0].flag_reason is None


def test_score_wards_empty_input_returns_empty():
    assert service.score_wards([], run_id="run-4") == []


def test_persist_scores_inserts_one_row_per_ward():
    db = FakeSupabase()
    features = [_feature(ward_id="WARD-01"), _feature(ward_id="WARD-02")]
    scores = service.score_wards(features, run_id="run-5")
    service.persist_scores(db, scores)

    assert len(db._tables["risk_scores"].rows) == 2
    ward_ids = {r["ward_id"] for r in db._tables["risk_scores"].rows}
    assert ward_ids == {"WARD-01", "WARD-02"}
