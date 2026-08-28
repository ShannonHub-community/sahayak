import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import httpx
import respx

from config import get_settings
from services.flood_engine import service
from services.flood_engine.schemas import WardAttributes
from services.flood_engine.tests.seed import WARD_ATTRS


def _wards():
    return [WardAttributes(**w) for w in WARD_ATTRS]


def _openmeteo_response(precipitation):
    return httpx.Response(200, json={"hourly": {"precipitation": [None, precipitation]}})


def setup_module(_module):
    get_settings.cache_clear()


def test_run_ingestion_success_all_sources():
    settings = get_settings()
    with respx.mock:
        respx.get(settings.open_meteo_base_url).mock(return_value=_openmeteo_response(12.5))
        respx.get(f"{settings.cwc_base_url}/stations/STN-01/latest").mock(
            return_value=httpx.Response(200, json={"discharge_m3s": 120.0})
        )
        respx.get(f"{settings.cwc_base_url}/stations/STN-02/latest").mock(
            return_value=httpx.Response(200, json={"discharge_m3s": 80.0})
        )

        readings, failures = asyncio.run(service.run_ingestion(_wards(), "run-1"))

    assert len(readings) == 2
    assert failures == []

    r1 = next(r for r in readings if r.ward_id == "WARD-01")
    assert r1.rainfall_mm == 12.5
    assert r1.discharge_m3s == 120.0
    assert r1.elevation_m == 12.4   # from cached DEM file, not ward_attributes
    assert r1.slope == 1.8
    assert "open-meteo" in r1.source
    assert "cwc" in r1.source
    assert "dem" in r1.source
    assert r1.run_id == "run-1"


def test_run_ingestion_isolates_per_ward_source_failures():
    """One ward's CWC failure must not block rainfall ingestion for it, nor
    affect the other ward at all."""
    settings = get_settings()
    with respx.mock:
        respx.get(settings.open_meteo_base_url).mock(return_value=_openmeteo_response(5.0))
        respx.get(f"{settings.cwc_base_url}/stations/STN-01/latest").mock(
            return_value=httpx.Response(200, json={"discharge_m3s": 50.0})
        )
        respx.get(f"{settings.cwc_base_url}/stations/STN-02/latest").mock(
            return_value=httpx.Response(500)
        )

        readings, failures = asyncio.run(service.run_ingestion(_wards(), "run-2"))

    assert len(readings) == 2  # both wards still produce a row

    ward1 = next(r for r in readings if r.ward_id == "WARD-01")
    ward2 = next(r for r in readings if r.ward_id == "WARD-02")
    assert ward1.discharge_m3s == 50.0
    assert ward2.discharge_m3s is None       # failed source -> None, not blocked
    assert ward2.rainfall_mm == 5.0          # other source still succeeded

    cwc_failures = [f for f in failures if f.source == "cwc"]
    assert len(cwc_failures) == 1
    assert cwc_failures[0].ward_id == "WARD-02"
    assert cwc_failures[0].run_id == "run-2"


def test_run_ingestion_openmeteo_outage_does_not_block_cwc():
    settings = get_settings()
    with respx.mock:
        respx.get(settings.open_meteo_base_url).mock(side_effect=httpx.ConnectError("outage"))
        respx.get(f"{settings.cwc_base_url}/stations/STN-01/latest").mock(
            return_value=httpx.Response(200, json={"discharge_m3s": 10.0})
        )
        respx.get(f"{settings.cwc_base_url}/stations/STN-02/latest").mock(
            return_value=httpx.Response(200, json={"discharge_m3s": 20.0})
        )

        readings, failures = asyncio.run(service.run_ingestion(_wards(), "run-3"))

    assert len(readings) == 2
    assert all(r.rainfall_mm is None for r in readings)
    assert all(r.discharge_m3s is not None for r in readings)
    assert len([f for f in failures if f.source == "open-meteo"]) == 2


def test_missing_cwc_station_id_fails_gracefully():
    settings = get_settings()
    ward_no_station = WardAttributes(
        ward_id="WARD-03", district="Panvel", name="Ward 3",
        centroid_lat=19.05, centroid_lon=73.13, elevation_m=20.0, slope=2.0,
        drainage_density=1.0, historical_flood_count=1, cwc_station_id=None,
    )
    with respx.mock:
        respx.get(settings.open_meteo_base_url).mock(return_value=_openmeteo_response(1.0))

        readings, failures = asyncio.run(service.run_ingestion([ward_no_station], "run-4"))

    assert len(readings) == 1
    assert readings[0].discharge_m3s is None
    assert any(f.source == "cwc" and f.ward_id == "WARD-03" for f in failures)
