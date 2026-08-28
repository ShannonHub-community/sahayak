import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import pytest

from services.flood_engine import service
from services.flood_engine.schemas import WardReading
from services.flood_engine.tests.seed import seed_wards
from tests.fake_supabase import FakeSupabase


def _db():
    db = FakeSupabase()
    seed_wards(db)
    return db


def _reading(**overrides):
    base = dict(
        ward_id="WARD-01", rainfall_mm=10.0, discharge_m3s=100.0,
        elevation_m=12.4, slope=1.8, source="open-meteo+cwc+dem",
        run_id="run-1", fetched_at="2026-08-22T10:00:00+00:00",
    )
    base.update(overrides)
    return WardReading(**base)


def test_build_features_basic_derivation():
    db = _db()
    features = service.build_features(db, [_reading()])
    assert len(features) == 1

    f = features[0]
    assert f.ward_id == "WARD-01"
    assert f.rainfall_mm == 10.0
    assert f.drainage_density == 2.5
    assert f.historical_flood_count == 3
    assert f.drainage_adjusted_rainfall == pytest.approx(10.0 / 3.5)  # 10 / (1 + 2.5)
    assert f.discharge_trend == 0.0   # no prior reading for this ward yet


def test_build_features_missing_ward_attributes_fails_loudly():
    db = _db()
    reading = _reading(ward_id="WARD-99")
    with pytest.raises(service.FeatureSchemaError):
        service.build_features(db, [reading])


def test_build_features_missing_required_attribute_field_fails_loudly():
    db = FakeSupabase()
    db.seed("ward_attributes", [{
        "ward_id": "WARD-05", "district": "Panvel", "name": "Ward 5",
        "centroid_lat": 19.0, "centroid_lon": 73.0,
        "elevation_m": 10.0, "slope": 1.0,
        "drainage_density": None,          # missing
        "historical_flood_count": None,    # missing
        "cwc_station_id": "STN-05",
    }])
    reading = _reading(ward_id="WARD-05")
    with pytest.raises(service.FeatureSchemaError):
        service.build_features(db, [reading])


def test_discharge_trend_uses_previous_reading():
    db = _db()
    db.seed("ward_readings", [{
        "id": "r0", "ward_id": "WARD-01", "rainfall_mm": 2.0, "discharge_m3s": 60.0,
        "elevation_m": 12.4, "slope": 1.8, "source": "open-meteo+cwc+dem",
        "run_id": "run-0", "fetched_at": "2026-08-22T08:00:00+00:00",
    }])

    features = service.build_features(db, [_reading()])
    assert features[0].discharge_trend == pytest.approx(40.0)  # 100 - 60, rising


def test_discharge_trend_negative_when_falling():
    db = _db()
    db.seed("ward_readings", [{
        "id": "r0", "ward_id": "WARD-01", "rainfall_mm": 2.0, "discharge_m3s": 150.0,
        "elevation_m": 12.4, "slope": 1.8, "source": "open-meteo+cwc+dem",
        "run_id": "run-0", "fetched_at": "2026-08-22T08:00:00+00:00",
    }])

    features = service.build_features(db, [_reading()])
    assert features[0].discharge_trend == pytest.approx(-50.0)  # 100 - 150, falling


def test_rainfall_accum_window_sums_recent_readings_within_window():
    db = _db()
    db.seed("ward_readings", [
        {"id": "r0", "ward_id": "WARD-01", "rainfall_mm": 3.0, "discharge_m3s": 50.0,
         "elevation_m": 12.4, "slope": 1.8, "source": "open-meteo+cwc+dem",
         "run_id": "run-0", "fetched_at": "2026-08-22T09:00:00+00:00"},  # within 24h window
        {"id": "r_old", "ward_id": "WARD-01", "rainfall_mm": 99.0, "discharge_m3s": 50.0,
         "elevation_m": 12.4, "slope": 1.8, "source": "open-meteo+cwc+dem",
         "run_id": "run-old", "fetched_at": "2026-08-19T09:00:00+00:00"},  # outside window
    ])

    features = service.build_features(db, [_reading()])
    # 10.0 (current) + 3.0 (within window) ; the 99.0 reading is outside the 24h window
    assert features[0].rainfall_accum_window == pytest.approx(13.0)


def test_build_features_uses_reading_elevation_over_stale_ward_attribute():
    db = _db()
    reading = _reading(elevation_m=99.9, slope=5.5)
    features = service.build_features(db, [reading])
    assert features[0].elevation_m == 99.9
    assert features[0].slope == 5.5
