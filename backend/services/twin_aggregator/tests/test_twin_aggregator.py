
from datetime import datetime
from uuid import uuid4, UUID
from services.twin_aggregator.schemas import TwinMapState
from services.twin_aggregator.service import (
    compute_diff,
    extract_location,
    extract_severity,
    extract_timestamp,
    normalize_entity,
)


def test_twin_map_state_schema():
    # Verify the TwinMapState schema parsing
    entity_id = uuid4()
    now = datetime.now()
    data = {
        "id": entity_id,
        "entity_type": "sos_report",
        "location": {"lat": 12.34, "lng": 56.78},
        "symbol": "sos-marker",
        "severity_count": 3,
        "status": "active",
        "last_updated": now,
    }
    state = TwinMapState(**data)
    
    assert state.id == entity_id
    assert state.entity_type == "sos_report"
    assert state.location == {"lat": 12.34, "lng": 56.78}
    assert state.symbol == "sos-marker"
    assert state.severity_count == 3
    assert state.status == "active"
    assert state.last_updated == now


def test_extract_location():
    # Valid dict location
    rec1 = {"location": {"lat": 10.0, "lng": 20.0}}
    assert extract_location(rec1) == {"lat": 10.0, "lng": 20.0}

    # Latitude/Longitude fields
    rec2 = {"latitude": "12.34", "lng": 56.78}
    assert extract_location(rec2) == {"lat": 12.34, "lng": 56.78}

    # Fallback default
    rec3 = {}
    assert extract_location(rec3) == {"lat": 0.0, "lng": 0.0}


def test_extract_severity():
    # Direct severity_count
    rec1 = {"severity_count": 5}
    assert extract_severity(rec1, "sos_report") == 5

    # SOS report text map
    rec2 = {"severity": "Critical"}
    assert extract_severity(rec2, "sos_report") == 4

    rec3 = {"severity": "High"}
    assert extract_severity(rec3, "sos_report") == 3

    rec4 = {"severity": "Medium"}
    assert extract_severity(rec4, "sos_report") == 2

    # Resource unit fallback (quantity/capacity)
    rec5 = {"quantity": "15"}
    assert extract_severity(rec5, "resource_unit") == 15


def test_compute_diff():
    # Setup test states
    id1 = str(uuid4())
    id2 = str(uuid4())
    id3 = str(uuid4())

    state_a = {
        id1: {"id": id1, "val": "foo"},
        id2: {"id": id2, "val": "bar"},
    }

    # id1 is updated, id2 is removed, id3 is added
    state_b = {
        id1: {"id": id1, "val": "foo-updated"},
        id3: {"id": id3, "val": "baz"},
    }

    diff = compute_diff(state_a, state_b)
    
    assert diff["added"] == [{"id": id3, "val": "baz"}]
    assert diff["updated"] == [{"id": id1, "val": "foo-updated"}]
    assert diff["removed"] == [id2]


def test_normalize_entity():
    entity_id = uuid4()
    record = {
        "id": str(entity_id),
        "latitude": 1.0,
        "longitude": 2.0,
        "severity": "High",
        "category": "flood",
        "status": "pending",
        "created_at": "2026-08-25T12:00:00+00:00"
    }

    normalized = normalize_entity(record, "sos_report")

    assert normalized.id == entity_id
    assert normalized.entity_type == "sos_report"
    assert normalized.location == {"lat": 1.0, "lng": 2.0}
    assert normalized.symbol == "flood"
    assert normalized.severity_count == 3
    assert normalized.status == "pending"
    assert normalized.last_updated == datetime.fromisoformat("2026-08-25T12:00:00+00:00")
