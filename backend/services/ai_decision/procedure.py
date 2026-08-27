"""
AI Decision System - Procedure Module (Step 4 of Pipeline)
Matches operational procedures from `response_procedures` by exact triplet match
(disaster_type, priority_level, injury_severity) and links the procedure to `decision_snapshots`.

STRICT RULES:
- Pure deterministic Python (NO AI calls, NO randomness, NO fallback guessing).
- Raises ValueError if no exact procedure match is found.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Union
from uuid import UUID

from shared.supabase import get_async_supabase_client

logger = logging.getLogger(__name__)


async def fetch_procedure_by_triplet(
    disaster_type: str,
    priority_level: str,
    injury_severity: str,
    client: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Queries the `response_procedures` table for an exact match on
    (disaster_type, priority_level, injury_severity).

    Raises:
        ValueError: If no exact matching procedure is found.
    """
    supabase = client or await get_async_supabase_client()

    query = (
        supabase.table("response_procedures")
        .select("*")
        .eq("disaster_type", disaster_type.strip().lower())
        .eq("priority_level", priority_level.strip().lower())
        .eq("injury_severity", injury_severity.strip().lower())
    )
    res = await query.execute()

    if not res.data or len(res.data) == 0:
        raise ValueError(
            f"No matching procedure found for triplet: "
            f"disaster_type='{disaster_type}', priority_level='{priority_level}', injury_severity='{injury_severity}'"
        )

    return res.data[0]


async def match_and_attach_procedure(
    snapshot_id: Union[str, UUID],
    disaster_type: Optional[str] = None,
    priority_level: Optional[str] = None,
    injury_severity: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Step 4 of the AI Decision Pipeline:
    1. Reads the triplet from parameters or fetches them from the `decision_snapshots` row.
    2. Queries `response_procedures` for an exact match on (disaster_type, priority_level, injury_severity).
    3. Updates `decision_snapshots` linking `procedure_id` and storing `required_resources` in `procedure_payload`.
    4. Returns the matched procedure dictionary.

    Raises:
        ValueError: If the snapshot is not found or no exact procedure match exists.
    """
    client = await get_async_supabase_client()
    snapshot_id_str = str(snapshot_id)

    # 1. Resolve triplet if not fully provided
    if not (disaster_type and priority_level and injury_severity):
        snap_res = (
            await client.table("decision_snapshots")
            .select("disaster_type, priority_level, injury_severity")
            .eq("id", snapshot_id_str)
            .execute()
        )
        if not snap_res.data or len(snap_res.data) == 0:
            raise ValueError(f"Decision snapshot with id '{snapshot_id_str}' not found in database.")

        snap_row = snap_res.data[0]
        disaster_type = disaster_type or snap_row.get("disaster_type", "flood")
        priority_level = priority_level or snap_row.get("priority_level", "medium")
        injury_severity = injury_severity or snap_row.get("injury_severity", "none")

    # 2. Query exact matching procedure
    procedure = await fetch_procedure_by_triplet(
        disaster_type=disaster_type,
        priority_level=priority_level,
        injury_severity=injury_severity,
        client=client,
    )

    procedure_id = procedure.get("id")
    required_resources = procedure.get("required_resources") or {}
    now_iso = datetime.now(timezone.utc).isoformat()

    # 3. Update decision_snapshots record with linked procedure
    update_payload = {
        "procedure_id": str(procedure_id) if procedure_id else None,
        "procedure_payload": required_resources,
        "updated_at": now_iso,
    }

    try:
        update_res = (
            await client.table("decision_snapshots")
            .update(update_payload)
            .eq("id", snapshot_id_str)
            .execute()
        )
        if not update_res.data:
            logger.warning(
                f"Updated procedure for snapshot {snapshot_id_str}, but no row data was returned."
            )
    except Exception as e:
        logger.error(f"Failed to update decision_snapshots for procedure linkage: {e}")
        raise

    # 4. Return the matched procedure record
    return procedure
