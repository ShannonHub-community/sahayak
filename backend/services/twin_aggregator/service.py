import asyncio
import logging
from datetime import datetime
from uuid import UUID
from typing import Any, Dict, Optional, List
from fastapi import WebSocket
from supabase import AsyncClient
from shared.config import get_settings
from shared.supabase import get_async_supabase_client
from services.twin_aggregator.schemas import TwinMapState

logger = logging.getLogger(__name__)
settings = get_settings()

# State cache mapping entity ID (str) to serialized TwinMapState JSON dictionary
_current_state: Dict[str, Dict[str, Any]] = {}
state_lock = asyncio.Lock()


class ConnectionManager:
    """
    Manages active WebSocket connections from Next.js clients.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        tasks = [self._send_to_connection(conn, message) for conn in self.active_connections]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_to_connection(self, connection: WebSocket, message: Dict[str, Any]):
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send JSON to WebSocket client: {e}")


manager = ConnectionManager()


def get_current_map_state() -> Dict[str, Dict[str, Any]]:
    """
    Returns a copy of the current normalized map state.
    """
    return _current_state.copy()


def compute_diff(old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Dict[str, List[Any]]:
    """
    Computes differences (add/update/remove) between an old state dictionary and a new state dictionary.
    
    Returns:
        dict: {
            "added": [new_records...],
            "updated": [updated_records...],
            "removed": [removed_ids...]
        }
    """
    added = []
    updated = []
    removed = []

    for key, new_val in new_state.items():
        if key not in old_state:
            added.append(new_val)
        elif old_state[key] != new_val:
            updated.append(new_val)

    for key in old_state:
        if key not in new_state:
            removed.append(key)

    return {
        "added": added,
        "updated": updated,
        "removed": removed
    }


def extract_location(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts latitude and longitude from the record into a unified location dict.
    """
    loc = record.get("location")
    if isinstance(loc, Dict):
        return loc
    
    lat = record.get("latitude") or record.get("lat")
    lng = record.get("longitude") or record.get("lng")
    try:
        if lat is not None and lng is not None:
            return {"lat": float(lat), "lng": float(lng)}
    except (ValueError, TypeError):
        pass
    
    return {"lat": 0.0, "lng": 0.0}


def extract_severity(record: Dict[str, Any], entity_type: str) -> int:
    """
    Extracts or maps severity count based on the entity type and payload contents.
    """
    sev = record.get("severity_count")
    if sev is not None:
        try:
            return int(sev)
        except (ValueError, TypeError):
            pass

    if entity_type == "sos_report":
        sev_val = record.get("severity")
        if isinstance(sev_val, int):
            return sev_val
        if isinstance(sev_val, str):
            sev_lower = sev_val.lower()
            if "critical" in sev_lower or "extreme" in sev_lower:
                return 4
            if "high" in sev_lower:
                return 3
            if "medium" in sev_lower or "moderate" in sev_lower:
                return 2
            if "low" in sev_lower:
                return 1
        return 1
    else:  # resource_unit
        qty = record.get("quantity") or record.get("capacity")
        if qty is not None:
            try:
                return int(qty)
            except (ValueError, TypeError):
                pass
        return 1


def extract_timestamp(record: Dict[str, Any]) -> datetime:
    """
    Parses timestamps from the record or falls back to the current UTC time.
    """
    ts = record.get("last_updated") or record.get("updated_at") or record.get("created_at")
    if ts:
        try:
            if isinstance(ts, str):
                clean_ts = ts.replace("Z", "+00:00")
                return datetime.fromisoformat(clean_ts)
            elif isinstance(ts, datetime):
                return ts
        except Exception:
            pass
    return datetime.utcnow()


def normalize_entity(record: Dict[str, Any], entity_type: str) -> TwinMapState:
    """
    Transforms database record into the strict TwinMapState shape.
    """
    entity_id = record.get("id")
    if not entity_id:
        raise ValueError("Record is missing an ID")

    if isinstance(entity_id, str):
        entity_uuid = UUID(entity_id)
    elif isinstance(entity_id, UUID):
        entity_uuid = entity_id
    else:
        raise ValueError(f"Unsupported ID type: {type(entity_id)}")

    location = extract_location(record)
    
    if entity_type == "sos_report":
        symbol = record.get("symbol") or record.get("category") or "sos-marker"
    else:
        symbol = record.get("symbol") or record.get("type") or "resource-marker"
        
    status = record.get("status") or "active"
    severity_count = extract_severity(record, entity_type)
    last_updated = extract_timestamp(record)

    return TwinMapState(
        id=entity_uuid,
        entity_type=entity_type,
        location=location,
        symbol=symbol,
        severity_count=severity_count,
        status=status,
        last_updated=last_updated
    )


async def process_change(client: AsyncClient, table: str, event_type: str, record: Dict[str, Any]):
    """
    Processes a Realtime change event, upserts/deletes from DB, updates state cache, and broadcasts diff.
    """
    entity_type = "sos_report" if table == "sos_reports" else "resource_unit"
    
    async with state_lock:
        old_state = _current_state.copy()
        
        if event_type == "DELETE":
            entity_id = record.get("id")
            if not entity_id:
                logger.warning(f"DELETE event for {table} but record is missing ID.")
                return
            entity_id_str = str(entity_id)
            
            try:
                await client.table("twin_map_state").delete().eq("id", entity_id_str).execute()
            except Exception as e:
                logger.error(f"Failed to delete {entity_id_str} from twin_map_state: {e}")
                
            _current_state.pop(entity_id_str, None)
            
        else:  # INSERT or UPDATE
            try:
                normalized = normalize_entity(record, entity_type)
            except Exception as e:
                logger.error(f"Failed to normalize {entity_type} record: {e}. Record: {record}")
                return

            db_data = normalized.model_dump(mode="json")
            
            try:
                await client.table("twin_map_state").upsert(db_data).execute()
            except Exception as e:
                logger.error(f"Failed to upsert state for {normalized.id} to twin_map_state: {e}")
                return

            _current_state[str(normalized.id)] = db_data

        diff = compute_diff(old_state, _current_state)
        
        # Broadcast diff if any changes occurred
        if diff["added"] or diff["updated"] or diff["removed"]:
            await manager.broadcast(diff)


def handle_postgres_changes(client: AsyncClient, table: str, payload: Dict[str, Any]):
    """
    Postgres changes callback that schedules async event handling on the main event loop.
    """
    data = payload.get("data")
    if not data:
        return
        
    event_type = data.get("type")
    
    if event_type == "DELETE":
        record = data.get("old_record")
    else:
        record = data.get("record")
        
    if not record:
        logger.warning(f"Received {event_type} event for {table} but record/old_record is empty.")
        return
        
    asyncio.create_task(process_change(client, table, event_type, record))


async def init_state(client: AsyncClient):
    """
    Initializes the state cache from the twin_map_state table in Supabase.
    """
    global _current_state
    try:
        response = await client.table("twin_map_state").select("*").execute()
        records = response.data or []
        async with state_lock:
            _current_state.clear()
            for rec in records:
                _current_state[str(rec["id"])] = rec
        logger.info(f"Initialized twin aggregator state cache with {len(_current_state)} entities.")
    except Exception as e:
        logger.error(f"Failed to initialize state from twin_map_state: {e}")


async def run_realtime_listener():
    """
    Daemon loop that runs the Supabase Realtime client listener.
    """
    if not settings.supabase_url or not settings.supabase_key:
        logger.error("Supabase credentials missing. Realtime listener cannot start.")
        return

    while True:
        try:
            logger.info("Initializing Realtime listener async client...")
            client = await get_async_supabase_client()
            
            # Load current state from the database
            await init_state(client)
            
            # Create a channel and register listeners
            channel = client.channel("twin_aggregator_changes")
            
            channel.on_postgres_changes(
                event="*",
                schema="public",
                table="sos_reports",
                callback=lambda payload: handle_postgres_changes(client, "sos_reports", payload)
            )
            
            channel.on_postgres_changes(
                event="*",
                schema="public",
                table="resource_units",
                callback=lambda payload: handle_postgres_changes(client, "resource_units", payload)
            )
            
            await channel.subscribe()
            logger.info("Subscribed to Supabase Realtime changes for 'sos_reports' and 'resource_units'.")
            
            # Keep client alive
            while True:
                await asyncio.sleep(5)
                
        except asyncio.CancelledError:
            logger.info("Realtime listener background task cancelled.")
            break
        except Exception as e:
            logger.error(f"Realtime listener error: {e}. Reconnecting in 10 seconds...")
            await asyncio.sleep(10)


_listener_task: Optional[asyncio.Task] = None


async def start_background_tasks():
    """
    Starts the realtime listener background task.
    """
    global _listener_task
    if _listener_task is not None and not _listener_task.done():
        logger.warning("Realtime listener is already running.")
        return
    _listener_task = asyncio.create_task(run_realtime_listener())
    logger.info("Started twin aggregator background task.")


async def stop_background_tasks():
    """
    Stops the realtime listener background task.
    """
    global _listener_task
    if _listener_task is not None:
        _listener_task.cancel()
        try:
            await _listener_task
        except asyncio.CancelledError:
            pass
        _listener_task = None
        logger.info("Stopped twin aggregator background task.")
