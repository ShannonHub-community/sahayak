import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException

from shared.supabase import get_supabase_client
from services.resource_service.schemas import (
    ResourceCreate, ResourceUpdate, ResourceResponse, DonationTransferEvent,
    HandoverRequest, AIInsightResponse, BroadcastNeedRequest,
    ResourceCategory, ResourceStatus, ResourceSource
)


class ResourceService:
    def __init__(self):
        self.supabase = get_supabase_client()

    # ── Inventory Ingestion ────────────────────────────────────────────

    async def ingest_government_stock(self, data: ResourceCreate) -> ResourceResponse:
        """Validate category/subtype via schema, insert with source='government', status='available'."""
        record = data.model_dump(mode='json')
        # Force government defaults regardless of payload
        record['status'] = ResourceStatus.AVAILABLE.value
        record['source'] = ResourceSource.GOVERNMENT.value

        query = self.supabase.table('resources').insert(record)
        res = await asyncio.to_thread(query.execute)

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to insert government stock")

        return ResourceResponse(**res.data[0])

    async def ingest_donation_transfer(self, data: DonationTransferEvent) -> ResourceResponse:
        """Ingest an approved donation transfer. Insert record with source='donation'."""
        record = {
            'category': data.category.value,
            'subtype': data.subtype,
            'name': data.name,
            'quantity': data.quantity,
            'location': data.location.model_dump(),
            'status': ResourceStatus.AVAILABLE.value,
            'source': ResourceSource.DONATION.value,
        }

        # Link to target shelter if provided
        if data.target_shelter_id:
            record['assigned_to'] = str(data.target_shelter_id)

        query = self.supabase.table('resources').insert(record)
        res = await asyncio.to_thread(query.execute)

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to insert donation stock")

        inserted_resource = res.data[0]

        # Audit log in tickets
        ticket_record = {
            'order_name': f"Donation Transfer: {data.quantity} {data.subtype}",
            'type': 'dispatch',
            'department': 'Disaster Logistics / Resource Management',
            'status': 'executed',
            'issued_by': 'donation_coordinator',
            'executed_by': 'resource_manager',
            'source': 'resource_manager',
        }
        ticket_query = self.supabase.table('tickets').insert(ticket_record)
        await asyncio.to_thread(ticket_query.execute)

        return ResourceResponse(**inserted_resource)

    # ── Inventory Queries ──────────────────────────────────────────────

    async def get_resources(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        zone: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ResourceResponse]:
        """Filter by category, status, zone_name; support text search on name/subtype."""
        query = self.supabase.table('resources').select('*')

        if category:
            query = query.eq('category', category)
        if status:
            query = query.eq('status', status)
        if search:
            query = query.ilike('name', f'%{search}%')

        res = await asyncio.to_thread(query.execute)

        # In-memory filter for zone (nested inside JSONB location)
        results = res.data
        if zone:
            results = [r for r in results if r.get('location', {}).get('zone_name') == zone]

        return [ResourceResponse(**r) for r in results]

    async def get_resource_by_id(self, resource_id: str) -> ResourceResponse:
        query = self.supabase.table('resources').select('*').eq('id', resource_id)
        res = await asyncio.to_thread(query.execute)
        if not res.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        return ResourceResponse(**res.data[0])

    # ── Inventory Update ───────────────────────────────────────────────

    async def update_resource(self, resource_id: str, data: ResourceUpdate) -> ResourceResponse:
        update_data = data.model_dump(exclude_unset=True)
        # Serialize enum and UUID values for Supabase
        if 'status' in update_data and update_data['status'] is not None:
            update_data['status'] = update_data['status'].value
        if 'assigned_to' in update_data and update_data['assigned_to'] is not None:
            update_data['assigned_to'] = str(update_data['assigned_to'])

        query = self.supabase.table('resources').update(update_data).eq('id', resource_id)
        res = await asyncio.to_thread(query.execute)
        if not res.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        return ResourceResponse(**res.data[0])

    # ── Dispatch & Handover ────────────────────────────────────────────

    async def execute_handover(self, data: HandoverRequest, team_name: str = "Unknown Team") -> ResourceResponse:
        """
        Atomic handover:
        1. Verify resource is 'available'.
        2. Update status to 'assigned', set assigned_to = workforce_request_id.
        3. Write immutable audit entry to `tickets`.
        """
        # 1. Verify availability
        query = self.supabase.table('resources').select('*').eq('id', str(data.resource_id))
        res = await asyncio.to_thread(query.execute)
        if not res.data:
            raise HTTPException(status_code=404, detail="Resource not found")

        resource = res.data[0]
        if resource['status'] != ResourceStatus.AVAILABLE.value:
            raise HTTPException(status_code=400, detail="Resource is not available for handover")

        # 2. Atomic transition — conditional update on status='available' prevents double-allocation
        update_query = self.supabase.table('resources').update({
            'status': ResourceStatus.ASSIGNED.value,
            'assigned_to': str(data.workforce_request_id),
        }).eq('id', str(data.resource_id)).eq('status', ResourceStatus.AVAILABLE.value)

        update_res = await asyncio.to_thread(update_query.execute)
        if not update_res.data:
            raise HTTPException(status_code=409, detail="Resource state conflict during handover")

        updated_resource = update_res.data[0]

        # 3. Immutable audit log in tickets
        ticket_record = {
            'order_name': f"Handover: {updated_resource['quantity']} {updated_resource['subtype']} to {team_name}",
            'type': 'dispatch',
            'department': 'Disaster Logistics / Resource Management',
            'status': 'executed',
            'issued_by': data.officer_id,
            'executed_by': team_name,
            'source': 'resource_manager',
        }
        ticket_query = self.supabase.table('tickets').insert(ticket_record)
        await asyncio.to_thread(ticket_query.execute)

        return ResourceResponse(**updated_resource)

    # ── AI Insights Engine ─────────────────────────────────────────────

    async def evaluate_insights(self) -> List[AIInsightResponse]:
        """
        Non-blocking, suggestion-only insight cards:
        - Depletion: available ration/water < 15% of total stock  → red/amber
        - Shelter Overcrowding: occupancy/capacity >= 0.95 → red, >= 0.90 → amber
        """
        insights: List[AIInsightResponse] = []

        query = self.supabase.table('resources').select('*')
        res = await asyncio.to_thread(query.execute)
        all_resources = res.data

        # 1. Depletion Alert — Ration supplies
        ration_resources = [r for r in all_resources if r['category'] == ResourceCategory.RATION.value]
        if ration_resources:
            total_qty = sum(r['quantity'] for r in ration_resources)
            avail_qty = sum(r['quantity'] for r in ration_resources if r['status'] == ResourceStatus.AVAILABLE.value)

            if total_qty > 0 and (avail_qty / total_qty) < 0.15:
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()),
                    type='depletion',
                    title='Critical Supply Depletion',
                    message=f'Ration supplies have dropped below 15% of total stock ({avail_qty}/{total_qty}).',
                    severity='red',
                    timestamp=datetime.now(timezone.utc),
                ))

        # 2. Shelter Overcrowding
        shelters = [r for r in all_resources if r['category'] == ResourceCategory.SHELTER_OBJECT.value and r.get('capacity')]
        for s in shelters:
            occupancy = s.get('occupancy') or 0
            capacity = s.get('capacity') or 1
            ratio = occupancy / capacity

            if ratio >= 0.95:
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()),
                    type='overcrowding',
                    title='Shelter Critical Overcrowding',
                    message=f"Shelter '{s.get('name')}' is at {ratio * 100:.1f}% capacity.",
                    severity='red',
                    timestamp=datetime.now(timezone.utc),
                ))
            elif ratio >= 0.90:
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()),
                    type='overcrowding',
                    title='Shelter Approaching Capacity',
                    message=f"Shelter '{s.get('name')}' is at {ratio * 100:.1f}% capacity.",
                    severity='amber',
                    timestamp=datetime.now(timezone.utc),
                ))

        return insights

    # ── Deficit Broadcast ──────────────────────────────────────────────

    async def broadcast_need(self, data: BroadcastNeedRequest) -> dict:
        """Format unmet demand payload for the Citizen Donation Portal."""
        return {
            'status': 'broadcasted',
            'category': data.category.value,
            'subtype': data.subtype,
            'quantity': data.quantity,
            'zone': data.zone,
            'urgency': data.urgency.value,
        }
