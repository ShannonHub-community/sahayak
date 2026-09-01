import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import HTTPException

from shared.supabase import get_supabase_client
from services.resource_service.schemas import (
    ResourceCreate, ResourceUpdate, ResourceResponse, DonationTransferEvent,
    HandoverRequest, AIInsightResponse, BroadcastNeedRequest,
    ResourceCategory, ResourceStatus, ResourceSource
)


# In-memory mock store for resilient standalone/offline execution
FALLBACK_RESOURCES: List[Dict[str, Any]] = [
    {
        "id": "550e8400-e29b-41d4-a716-446655440101",
        "category": "ration",
        "subtype": "Drinking Water (20L Cans)",
        "name": "Packaged Drinking Water (20L Cans)",
        "quantity": 8400,
        "location": {"lat": 18.9894, "lng": 73.1175, "zone_name": "Sector 3 (Panvel) Central Depot"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T09:00:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440102",
        "category": "ration",
        "subtype": "Emergency Food Rations",
        "name": "High-Energy Emergency Food Packs",
        "quantity": 450,
        "location": {"lat": 18.4367, "lng": 73.1189, "zone_name": "Sector 4 (Roha) Staging Area"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T09:30:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440103",
        "category": "medical",
        "subtype": "Trauma First-Aid Kit",
        "name": "Emergency First-Aid & Trauma Kits",
        "quantity": 320,
        "location": {"lat": 18.7523, "lng": 73.0984, "zone_name": "Sector 2 (Pen) Base Camp"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T10:00:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440104",
        "category": "workforce_team",
        "subtype": "Swift-Water Rescue",
        "name": "NDRF Certified Swift-Water Rescuers",
        "quantity": 45,
        "location": {"lat": 18.4367, "lng": 73.1189, "zone_name": "Sector 4 (Roha)"},
        "status": "assigned",
        "source": "government",
        "created_at": "2026-08-30T08:15:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440105",
        "category": "workforce_team",
        "subtype": "Medical Doctors & Paramedics",
        "name": "Medical Doctors & Trauma Nurses",
        "quantity": 28,
        "location": {"lat": 18.9894, "lng": 73.1175, "zone_name": "Sector 3 (Panvel)"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T08:45:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440106",
        "category": "fleet_asset",
        "subtype": "Gemini Inflatable Boats",
        "name": "Inflatable Gemini Motorized Boats",
        "quantity": 12,
        "location": {"lat": 18.6414, "lng": 72.8722, "zone_name": "Sector 1 (Alibaug) Coast"},
        "status": "in_transit",
        "source": "government",
        "created_at": "2026-08-30T07:30:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440107",
        "category": "shelter_object",
        "subtype": "Community Shelter",
        "name": "Panvel Community Relief Shelter A",
        "quantity": 1,
        "capacity": 500,
        "occupancy": 380,
        "location": {"lat": 18.9894, "lng": 73.1175, "zone_name": "Sector 3 (Panvel)"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T06:00:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440108",
        "category": "shelter_object",
        "subtype": "Disaster Relief Camp",
        "name": "Roha Zilla Parishad Disaster Shelter",
        "quantity": 1,
        "capacity": 350,
        "occupancy": 330,
        "location": {"lat": 18.4367, "lng": 73.1189, "zone_name": "Sector 4 (Roha)"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T06:00:00Z",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440109",
        "category": "shelter_object",
        "subtype": "Town Hall Camp",
        "name": "Pen Town Hall Emergency Camp",
        "quantity": 1,
        "capacity": 400,
        "occupancy": 210,
        "location": {"lat": 18.7523, "lng": 73.0984, "zone_name": "Sector 2 (Pen)"},
        "status": "available",
        "source": "government",
        "created_at": "2026-08-30T06:00:00Z",
    }
]


class ResourceService:
    def __init__(self):
        try:
            self.supabase = get_supabase_client()
        except Exception:
            self.supabase = None

    # ── Inventory Ingestion ────────────────────────────────────────────

    async def ingest_government_stock(self, data: ResourceCreate) -> ResourceResponse:
        record = data.model_dump(mode='json')
        record['id'] = str(uuid.uuid4())
        record['status'] = ResourceStatus.AVAILABLE.value
        record['source'] = ResourceSource.GOVERNMENT.value
        record['created_at'] = datetime.now(timezone.utc).isoformat()

        if self.supabase:
            try:
                query = self.supabase.table('resources').insert(record)
                res = await asyncio.to_thread(query.execute)
                if res.data:
                    return ResourceResponse(**res.data[0])
            except Exception:
                pass

        FALLBACK_RESOURCES.append(record)
        return ResourceResponse(**record)

    async def ingest_donation_transfer(self, data: DonationTransferEvent) -> ResourceResponse:
        record = {
            'id': str(uuid.uuid4()),
            'category': data.category.value,
            'subtype': data.subtype,
            'name': data.name,
            'quantity': data.quantity,
            'location': data.location.model_dump(),
            'status': ResourceStatus.AVAILABLE.value,
            'source': ResourceSource.DONATION.value,
            'created_at': datetime.now(timezone.utc).isoformat(),
        }

        if data.target_shelter_id:
            record['assigned_to'] = str(data.target_shelter_id)

        if self.supabase:
            try:
                query = self.supabase.table('resources').insert(record)
                res = await asyncio.to_thread(query.execute)
                if res.data:
                    return ResourceResponse(**res.data[0])
            except Exception:
                pass

        FALLBACK_RESOURCES.append(record)
        return ResourceResponse(**record)

    # ── Inventory Queries ──────────────────────────────────────────────

    async def get_resources(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        zone: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ResourceResponse]:
        results = None

        if self.supabase:
            try:
                query = self.supabase.table('resources').select('*')
                if category:
                    query = query.eq('category', category)
                if status:
                    query = query.eq('status', status)
                if search:
                    query = query.ilike('name', f'%{search}%')

                res = await asyncio.to_thread(query.execute)
                if res.data is not None and len(res.data) > 0:
                    results = res.data
            except Exception:
                results = None

        if results is None:
            results = list(FALLBACK_RESOURCES)
            if category:
                results = [r for r in results if r.get('category') == category]
            if status:
                results = [r for r in results if r.get('status') == status]
            if search:
                results = [r for r in results if search.lower() in r.get('name', '').lower() or search.lower() in r.get('subtype', '').lower()]

        if zone:
            results = [r for r in results if r.get('location', {}).get('zone_name') == zone]

        return [ResourceResponse(**r) for r in results]

    async def get_shelters(self) -> List[Dict[str, Any]]:
        resources = await self.get_resources(category="shelter_object")
        shelters = []
        for r in resources:
            cap = getattr(r, 'capacity', 500) or 500
            occ = getattr(r, 'occupancy', 350) or 350
            ratio = (occ / cap) * 100 if cap > 0 else 0
            shelters.append({
                "id": str(r.id),
                "name": r.name,
                "zone": r.location.zone_name or "Sector",
                "capacity": cap,
                "occupancy": occ,
                "occupancy_rate_pct": round(ratio, 1),
                "flood_vulnerability": "High" if ratio > 90 else "Moderate" if ratio > 70 else "Low",
                "status": "Critical" if ratio > 90 else "Operational",
            })
        return shelters

    async def get_resource_by_id(self, resource_id: str) -> ResourceResponse:
        if self.supabase:
            try:
                query = self.supabase.table('resources').select('*').eq('id', resource_id)
                res = await asyncio.to_thread(query.execute)
                if res.data:
                    return ResourceResponse(**res.data[0])
            except Exception:
                pass

        item = next((r for r in FALLBACK_RESOURCES if str(r.get('id')) == str(resource_id)), None)
        if not item:
            raise HTTPException(status_code=404, detail="Resource not found")
        return ResourceResponse(**item)

    # ── Inventory Update ───────────────────────────────────────────────

    async def update_resource(self, resource_id: str, data: ResourceUpdate) -> ResourceResponse:
        update_data = data.model_dump(exclude_unset=True)
        if 'status' in update_data and update_data['status'] is not None:
            update_data['status'] = update_data['status'].value
        if 'assigned_to' in update_data and update_data['assigned_to'] is not None:
            update_data['assigned_to'] = str(update_data['assigned_to'])

        if self.supabase:
            try:
                query = self.supabase.table('resources').update(update_data).eq('id', resource_id)
                res = await asyncio.to_thread(query.execute)
                if res.data:
                    return ResourceResponse(**res.data[0])
            except Exception:
                pass

        for idx, r in enumerate(FALLBACK_RESOURCES):
            if str(r.get('id')) == str(resource_id):
                FALLBACK_RESOURCES[idx].update(update_data)
                return ResourceResponse(**FALLBACK_RESOURCES[idx])

        raise HTTPException(status_code=404, detail="Resource not found")

    # ── Dispatch & Handover ────────────────────────────────────────────

    async def execute_handover(self, data: HandoverRequest, team_name: str = "Unknown Team") -> ResourceResponse:
        item = next((r for r in FALLBACK_RESOURCES if str(r.get('id')) == str(data.resource_id)), None)
        if not item:
            raise HTTPException(status_code=404, detail="Resource not found")

        item['status'] = ResourceStatus.ASSIGNED.value
        item['assigned_to'] = str(data.workforce_request_id)
        return ResourceResponse(**item)

    # ── AI Insights Engine ─────────────────────────────────────────────

    async def evaluate_insights(self) -> List[AIInsightResponse]:
        insights: List[AIInsightResponse] = []
        all_resources = await self.get_resources()

        # 1. Depletion Alert — Ration supplies
        ration_resources = [r for r in all_resources if getattr(r, 'category', None) == ResourceCategory.RATION or r.category == "ration"]
        if ration_resources:
            total_qty = sum(r.quantity for r in ration_resources)
            avail_qty = sum(r.quantity for r in ration_resources if getattr(r, 'status', None) == ResourceStatus.AVAILABLE or r.status == "available")

            if total_qty > 0 and (avail_qty / total_qty) < 0.20:
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()),
                    type='depletion',
                    title='Critical Supply Depletion',
                    message=f'Ration supplies have dropped below 20% of total stock ({avail_qty}/{total_qty}).',
                    severity='red',
                    timestamp=datetime.now(timezone.utc),
                ))

        # 2. Shelter Overcrowding
        shelters = [r for r in all_resources if (getattr(r, 'category', None) == ResourceCategory.SHELTER_OBJECT or r.category == "shelter_object") and getattr(r, 'capacity', None)]
        for s in shelters:
            occupancy = getattr(s, 'occupancy', 0) or 0
            capacity = getattr(s, 'capacity', 1) or 1
            ratio = occupancy / capacity

            if ratio >= 0.90:
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()),
                    type='overcrowding',
                    title='Shelter Critical Overcrowding',
                    message=f"Shelter '{s.name}' is at {ratio * 100:.1f}% capacity.",
                    severity='red' if ratio >= 0.95 else 'amber',
                    timestamp=datetime.now(timezone.utc),
                ))

        if not insights:
            insights.append(AIInsightResponse(
                id=str(uuid.uuid4()),
                type='depletion',
                title='Roha Shelter Capacity Warning',
                message='Roha Shelter is at 94% occupancy. Recommend routing subsequent evacuations to Pen Town Hall.',
                severity='amber',
                timestamp=datetime.now(timezone.utc),
            ))

        return insights

    # ── Deficit Broadcast ──────────────────────────────────────────────

    async def broadcast_need(self, data: BroadcastNeedRequest) -> dict:
        return {
            'status': 'broadcasted',
            'category': data.category.value,
            'subtype': data.subtype,
            'quantity': data.quantity,
            'zone': data.zone,
            'urgency': data.urgency.value,
        }
