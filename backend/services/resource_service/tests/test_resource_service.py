import pytest
from unittest.mock import MagicMock, patch
import uuid
from datetime import datetime, timezone

from pydantic import ValidationError

from services.resource_service.schemas import (
    ResourceCreate, ResourceCategory, ResourceSource, LocationSchema, HandoverRequest
)
from services.resource_service.service import ResourceService


# ── Fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
def mock_supabase():
    with patch('services.resource_service.service.get_supabase_client') as mock_client_getter:
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        yield mock_client


@pytest.fixture
def service(mock_supabase):
    return ResourceService()


# ── Helpers ────────────────────────────────────────────────────────────

def _make_full_resource(overrides: dict) -> dict:
    """Return a minimal valid resource row dict with all fields ResourceResponse expects."""
    base = {
        'id': str(uuid.uuid4()),
        'category': 'ration',
        'subtype': 'Dry Ration',
        'name': 'Test Resource',
        'quantity': 10,
        'location': {'lat': 18.98, 'lng': 73.11, 'zone_name': 'Panvel'},
        'capacity': None,
        'occupancy': None,
        'status': 'available',
        'source': 'government',
        'assigned_to': None,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    base.update(overrides)
    return base


# ── 1. Strict Taxonomy Validation ──────────────────────────────────────

def test_valid_personnel_subtype():
    location = LocationSchema(lat=18.98, lng=73.11, zone_name="Panvel")
    res = ResourceCreate(
        category=ResourceCategory.PERSONNEL,
        subtype="Rescue/Boat Operator",
        name="NDRF Team Alpha",
        quantity=5,
        location=location,
    )
    assert res.subtype == "Rescue/Boat Operator"


def test_invalid_subtype_raises():
    location = LocationSchema(lat=18.98, lng=73.11, zone_name="Panvel")
    with pytest.raises(ValidationError):
        ResourceCreate(
            category=ResourceCategory.PERSONNEL,
            subtype="Plumber",
            name="Plumbing Team",
            quantity=2,
            location=location,
        )


def test_shelter_requires_capacity_and_occupancy():
    location = LocationSchema(lat=18.98, lng=73.11, zone_name="Panvel")
    with pytest.raises(ValidationError):
        ResourceCreate(
            category=ResourceCategory.SHELTER_OBJECT,
            subtype="Tent",
            name="Emergency Tent",
            quantity=10,
            location=location,
            # Missing capacity and occupancy
        )


def test_shelter_valid_with_capacity():
    location = LocationSchema(lat=18.98, lng=73.11, zone_name="Panvel")
    res = ResourceCreate(
        category=ResourceCategory.SHELTER_OBJECT,
        subtype="Tent",
        name="Emergency Tent",
        quantity=10,
        location=location,
        capacity=50,
        occupancy=20,
    )
    assert res.capacity == 50
    assert res.occupancy == 20


# ── 2. Atomic Handover Transition & Audit Log ──────────────────────────

@pytest.mark.asyncio
async def test_execute_handover(service, mock_supabase):
    mock_resource_id = str(uuid.uuid4())
    mock_request_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    # Full resource row returned by SELECT (verify availability)
    select_row = _make_full_resource({
        'id': mock_resource_id,
        'status': 'available',
        'quantity': 10,
        'subtype': 'Dry Ration',
        'created_at': now_iso,
        'updated_at': now_iso,
    })

    # Full resource row returned by UPDATE (post-handover)
    updated_row = _make_full_resource({
        'id': mock_resource_id,
        'status': 'assigned',
        'quantity': 10,
        'subtype': 'Dry Ration',
        'assigned_to': mock_request_id,
        'created_at': now_iso,
        'updated_at': now_iso,
    })

    # Build mock chain for: table('resources').select('*').eq('id', ...) → execute()
    table_mock = MagicMock()
    mock_supabase.table.return_value = table_mock

    select_mock = MagicMock()
    eq_select = MagicMock()
    execute_select = MagicMock()
    execute_select.data = [select_row]
    table_mock.select.return_value = select_mock
    select_mock.eq.return_value = eq_select
    eq_select.execute = MagicMock(return_value=execute_select)

    # Build mock chain for: table('resources').update({...}).eq('id',...).eq('status','available') → execute()
    update_mock = MagicMock()
    eq_update_1 = MagicMock()
    eq_update_2 = MagicMock()
    execute_update = MagicMock()
    execute_update.data = [updated_row]
    table_mock.update.return_value = update_mock
    update_mock.eq.return_value = eq_update_1
    eq_update_1.eq.return_value = eq_update_2
    eq_update_2.execute = MagicMock(return_value=execute_update)

    # Build mock chain for: table('tickets').insert({...}) → execute()
    insert_mock = MagicMock()
    execute_insert = MagicMock()
    table_mock.insert.return_value = insert_mock
    insert_mock.execute = MagicMock(return_value=execute_insert)

    req = HandoverRequest(
        workforce_request_id=mock_request_id,
        resource_id=mock_resource_id,
        officer_id="officer_123",
    )

    result = await service.execute_handover(req, team_name="Team Alpha")

    # Verify resource transitioned to assigned
    assert result.status.value == 'assigned'
    assert result.assigned_to == uuid.UUID(mock_request_id)

    # Verify update was conditional on status='available'
    table_mock.update.assert_called_once()
    eq_update_1.eq.assert_called_with('status', 'available')

    # Verify ticket audit log was inserted with correct fields
    table_mock.insert.assert_called_with({
        'order_name': 'Handover: 10 Dry Ration to Team Alpha',
        'type': 'dispatch',
        'department': 'Disaster Logistics / Resource Management',
        'status': 'executed',
        'issued_by': 'officer_123',
        'executed_by': 'Team Alpha',
        'source': 'resource_manager',
    })


# ── 3. AI Insight Threshold Calculations ───────────────────────────────

@pytest.mark.asyncio
async def test_evaluate_insights(service, mock_supabase):
    table_mock = MagicMock()
    mock_supabase.table.return_value = table_mock
    select_mock = MagicMock()
    table_mock.select.return_value = select_mock
    execute_mock = MagicMock()
    select_mock.execute = MagicMock(return_value=execute_mock)

    # Seed mock data
    execute_mock.data = [
        # Ration: 10% available → should trigger Red depletion
        {'id': str(uuid.uuid4()), 'category': 'ration', 'quantity': 900, 'status': 'depleted'},
        {'id': str(uuid.uuid4()), 'category': 'ration', 'quantity': 100, 'status': 'available'},

        # Shelter: 95% full → should trigger Red overcrowding
        {'id': str(uuid.uuid4()), 'category': 'shelter_object', 'name': 'Panvel Hall', 'capacity': 300, 'occupancy': 285},

        # Shelter: 92% full → should trigger Amber overcrowding
        {'id': str(uuid.uuid4()), 'category': 'shelter_object', 'name': 'Sector 3 School', 'capacity': 500, 'occupancy': 460},

        # Vehicle: should not trigger anything
        {'id': str(uuid.uuid4()), 'category': 'vehicle', 'quantity': 5, 'status': 'available'},
    ]

    insights = await service.evaluate_insights()

    assert len(insights) == 3

    depletion_insights = [i for i in insights if i.type == 'depletion']
    assert len(depletion_insights) == 1
    assert depletion_insights[0].severity == 'red'
    assert '15%' in depletion_insights[0].message

    overcrowding_insights = [i for i in insights if i.type == 'overcrowding']
    assert len(overcrowding_insights) == 2

    panvel_alert = next(i for i in overcrowding_insights if 'Panvel Hall' in i.message)
    assert panvel_alert.severity == 'red'

    school_alert = next(i for i in overcrowding_insights if 'Sector 3 School' in i.message)
    assert school_alert.severity == 'amber'
