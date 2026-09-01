"""
AI Decision System - Validator Module (Step 6 of Pipeline)
Performs strict, deterministic validation of the AI directive against the new schema:
1. Schema integrity (all required directive fields present and correctly typed)
2. Resource availability (allocated_resources items exist in snapshot and have sufficient stock)
3. Procedural compliance and math (capacity, required items, personnel requirements)

STRICT RULES:
- Pure deterministic Python (NO AI calls, NO LLM prompts, NO randomness).
- Every single check produces an auditable pass/fail record.
- If any check fails, valid is False. Never silently pass partial plans.

NEW SCHEMA (ai_proposed_plan):
{
  "directive_id": "AI-DIR-XXXX",
  "timestamp": "ISO-8601-UTC",
  "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
  "incident_ref": "<incident UUID>",
  "action_type": "DISPATCH_WORKFORCE",
  "recommendation": {
    "target_unit_id": str,
    "target_unit_name": str,
    "destination_ward": str,
    "allocated_resources": [{"item_id": str, "name": str, "quantity": int}]
  },
  "ai_reasoning": str,
  "confidence_score": int (0-100)
}
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple, Union
from uuid import UUID

from shared.supabase import get_async_supabase_client

logger = logging.getLogger(__name__)

_VALID_PRIORITY_LEVELS = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
_VALID_ACTION_TYPES = {"DISPATCH_WORKFORCE"}


def _extract_allocated_resources(ai_proposed_plan: Any) -> List[Dict[str, Any]]:
    """
    Safely extracts the allocated_resources list from the new nested schema:
    ai_proposed_plan["recommendation"]["allocated_resources"]
    Returns an empty list if any part of the path is missing.
    """
    if not isinstance(ai_proposed_plan, dict):
        return []
    recommendation = ai_proposed_plan.get("recommendation")
    if not isinstance(recommendation, dict):
        return []
    resources = recommendation.get("allocated_resources")
    if not isinstance(resources, list):
        return []
    return resources


def _validate_schema_integrity(
    ai_proposed_plan: Any,
) -> Tuple[bool, str, List[str]]:
    """
    Check 1: Validates that ai_proposed_plan conforms to the new directive schema.

    Required top-level fields:
      - directive_id: str matching pattern AI-DIR-XXXX
      - timestamp: non-empty str
      - priority_level: one of CRITICAL | HIGH | MEDIUM | LOW
      - incident_ref: non-empty str
      - action_type: "DISPATCH_WORKFORCE"
      - recommendation: dict with required sub-fields
      - ai_reasoning: non-empty str
      - confidence_score: int 0-100

    Required recommendation sub-fields:
      - target_unit_id: non-empty str
      - target_unit_name: non-empty str
      - destination_ward: non-empty str
      - allocated_resources: list of {item_id: str, name: str, quantity: int >= 0}
    """
    errors: List[str] = []

    if not isinstance(ai_proposed_plan, dict):
        return False, "Directive is not a valid JSON dictionary.", [
            "ai_proposed_plan must be a dictionary object."
        ]

    # 1. directive_id
    directive_id = ai_proposed_plan.get("directive_id")
    if not directive_id or not isinstance(directive_id, str) or not directive_id.strip():
        errors.append("'directive_id' must be a non-empty string (e.g. AI-DIR-8042).")
    elif not directive_id.upper().startswith("AI-DIR-"):
        errors.append(f"'directive_id' must follow pattern AI-DIR-XXXX. Got: '{directive_id}'.")

    # 2. timestamp
    timestamp = ai_proposed_plan.get("timestamp")
    if not timestamp or not isinstance(timestamp, str) or not timestamp.strip():
        errors.append("'timestamp' must be a non-empty ISO-8601 UTC string.")

    # 3. priority_level
    priority_level = ai_proposed_plan.get("priority_level")
    if not isinstance(priority_level, str) or priority_level.strip().upper() not in _VALID_PRIORITY_LEVELS:
        errors.append(
            f"'priority_level' must be one of {sorted(_VALID_PRIORITY_LEVELS)}. Got: '{priority_level}'."
        )

    # 4. incident_ref
    incident_ref = ai_proposed_plan.get("incident_ref")
    if not incident_ref or not isinstance(incident_ref, str) or not incident_ref.strip():
        errors.append("'incident_ref' must be a non-empty string referencing the incident ID.")

    # 5. action_type
    action_type = ai_proposed_plan.get("action_type")
    if not isinstance(action_type, str) or action_type.strip().upper() not in _VALID_ACTION_TYPES:
        errors.append(
            f"'action_type' must be one of {sorted(_VALID_ACTION_TYPES)}. Got: '{action_type}'."
        )

    # 6. ai_reasoning
    ai_reasoning = ai_proposed_plan.get("ai_reasoning")
    if not isinstance(ai_reasoning, str) or not ai_reasoning.strip():
        errors.append("'ai_reasoning' must be a non-empty string explaining the operational rationale.")

    # 7. confidence_score
    confidence_score = ai_proposed_plan.get("confidence_score")
    if not isinstance(confidence_score, int) or not (0 <= confidence_score <= 100):
        errors.append(
            f"'confidence_score' must be an integer between 0 and 100. Got: '{confidence_score}'."
        )

    # 8. recommendation sub-object
    recommendation = ai_proposed_plan.get("recommendation")
    if not isinstance(recommendation, dict):
        errors.append("'recommendation' must be a dictionary object.")
    else:
        # 8a. target_unit_id
        target_unit_id = recommendation.get("target_unit_id")
        if not target_unit_id or not isinstance(target_unit_id, str) or not target_unit_id.strip():
            errors.append("'recommendation.target_unit_id' must be a non-empty string.")

        # 8b. target_unit_name
        target_unit_name = recommendation.get("target_unit_name")
        if not target_unit_name or not isinstance(target_unit_name, str) or not target_unit_name.strip():
            errors.append("'recommendation.target_unit_name' must be a non-empty string.")

        # 8c. destination_ward
        destination_ward = recommendation.get("destination_ward")
        if not destination_ward or not isinstance(destination_ward, str) or not destination_ward.strip():
            errors.append("'recommendation.destination_ward' must be a non-empty string.")

        # 8d. allocated_resources list
        allocated_resources = recommendation.get("allocated_resources")
        if not isinstance(allocated_resources, list):
            errors.append("'recommendation.allocated_resources' must be a list.")
        else:
            for idx, item in enumerate(allocated_resources):
                if not isinstance(item, dict):
                    errors.append(f"allocated_resources[{idx}] must be a dictionary.")
                    continue
                if not item.get("item_id") or not isinstance(item.get("item_id"), str):
                    errors.append(f"allocated_resources[{idx}] is missing a valid 'item_id' string.")
                if not item.get("name") or not isinstance(item.get("name"), str):
                    errors.append(f"allocated_resources[{idx}] is missing a valid 'name' string.")
                qty = item.get("quantity")
                if qty is None or not isinstance(qty, int) or qty < 0:
                    errors.append(
                        f"allocated_resources[{idx}] has invalid 'quantity' ({qty}). Must be non-negative integer."
                    )

    passed = len(errors) == 0
    details = "Directive schema is valid and all fields are correctly structured." if passed else \
              f"Schema integrity failed with {len(errors)} error(s)."
    return passed, details, errors


def _validate_resource_availability(
    allocated_resources: List[Dict[str, Any]],
    snapshot_data: Dict[str, Any],
) -> Tuple[bool, str, List[str]]:
    """
    Check 2: Validates that every item in allocated_resources:
    1. Exists in snapshot_data["resources"] (matched by item_id == resource.id)
    2. Has status 'available'
    3. Has sufficient stock (requested quantity <= available quantity)

    Uses item_id from the new schema (was resource_id in the old schema).
    """
    errors: List[str] = []

    raw_resources = snapshot_data.get("resources") or snapshot_data.get("available_resources") or []
    available_map: Dict[str, Dict[str, Any]] = {
        str(r["id"]): r for r in raw_resources if isinstance(r, dict) and "id" in r
    }

    # Aggregate requested allocations (handles multiple line items for the same resource)
    requested_allocations: Dict[str, int] = {}
    for item in allocated_resources:
        item_id = str(item.get("item_id", ""))
        qty = item.get("quantity", 0)
        if qty > 0:
            requested_allocations[item_id] = requested_allocations.get(item_id, 0) + qty

    for item_id, requested_qty in requested_allocations.items():
        if item_id not in available_map:
            # item_id may be a logical label (e.g. "RES-09") rather than a UUID —
            # attempt a name/label match as a soft fallback
            matched = next(
                (r for r in raw_resources
                 if isinstance(r, dict) and (
                     str(r.get("external_id", "")) == item_id
                     or str(r.get("label", "")) == item_id
                     or str(r.get("name", "")).lower() == item_id.lower()
                 )),
                None,
            )
            if not matched:
                errors.append(
                    f"Allocated resource item_id '{item_id}' does not exist in snapshot inventory."
                )
                continue
            resource_record = matched
        else:
            resource_record = available_map[item_id]

        status = str(resource_record.get("status", "")).lower()
        available_qty = int(resource_record.get("quantity", 0))
        res_name = resource_record.get("name", item_id)

        if status != "available":
            errors.append(
                f"Resource '{res_name}' (ID: {item_id}) has status '{status}', but only 'available' resources may be assigned."
            )

        if requested_qty > available_qty:
            errors.append(
                f"Resource '{res_name}' (ID: {item_id}) requested quantity ({requested_qty}) exceeds available stock ({available_qty})."
            )

    passed = len(errors) == 0
    details = (
        f"All {len(requested_allocations)} allocated resource(s) exist and have sufficient available inventory."
        if passed
        else f"Resource availability check failed with {len(errors)} inventory conflict(s)."
    )
    return passed, details, errors


def _validate_procedure_compliance(
    allocated_resources: List[Dict[str, Any]],
    procedure_payload: Dict[str, Any],
    snapshot_data: Dict[str, Any],
) -> Tuple[bool, str, List[str]]:
    """
    Check 3: Verifies the allocated resources satisfy procedure_payload constraints.
    Reads from the new allocated_resources schema: [{item_id, name, quantity}].
    Uses item_id to look up full resource metadata from snapshot.
    """
    errors: List[str] = []
    if not procedure_payload:
        return True, "No specific procedure constraints defined; auto-passed.", []

    raw_resources = snapshot_data.get("resources") or snapshot_data.get("available_resources") or []
    resource_lookup: Dict[str, Dict[str, Any]] = {
        str(r["id"]): r for r in raw_resources if isinstance(r, dict) and "id" in r
    }

    # Build enriched allocation tuples (resource_record, quantity) for constraint checks
    # Falls back to name-based matching if item_id is a logical label
    allocated_items: List[Tuple[Dict[str, Any], int]] = []
    for item in allocated_resources:
        item_id = str(item.get("item_id", ""))
        qty = item.get("quantity", 0)
        if qty <= 0:
            continue
        if item_id in resource_lookup:
            allocated_items.append((resource_lookup[item_id], qty))
        else:
            # Soft match by name for logical labels (e.g., "RES-09")
            matched = next(
                (r for r in raw_resources
                 if isinstance(r, dict) and (
                     str(r.get("name", "")).lower() == item.get("name", "").lower()
                     or str(r.get("label", "")) == item_id
                     or str(r.get("external_id", "")) == item_id
                 )),
                None,
            )
            if matched:
                allocated_items.append((matched, qty))
            else:
                # Use the item name from the directive itself as a synthetic stub
                allocated_items.append((
                    {"id": item_id, "name": item.get("name", item_id), "category": "", "subtype": ""},
                    qty,
                ))

    def _matches(r: Dict[str, Any], *keywords: str) -> bool:
        """True if any keyword appears in the resource's name, subtype, or category."""
        haystack = " ".join([
            str(r.get("name", "")),
            str(r.get("subtype", "")),
            str(r.get("category", "")),
        ]).lower()
        return any(kw.lower() in haystack for kw in keywords)

    # 1. Boat Capacity
    if "boat_capacity" in procedure_payload:
        required_capacity = int(procedure_payload["boat_capacity"])
        total_boat_capacity = sum(
            int(r.get("capacity") or 5) * qty
            for r, qty in allocated_items
            if _matches(r, "boat")
        )
        if total_boat_capacity < required_capacity:
            errors.append(
                f"Procedure requires boat_capacity >= {required_capacity}, but total recommended boat capacity is {total_boat_capacity}."
            )

    # 2. Medic Required
    if procedure_payload.get("medic_required") is True:
        medic_count = sum(qty for r, qty in allocated_items if _matches(r, "medic", "medical", "paramedic", "trauma"))
        if medic_count < 1:
            errors.append("Procedure specifies 'medic_required': true, but no medical personnel or kits were allocated.")

    # 3. Heavy Rescue Gear
    if procedure_payload.get("heavy_rescue_gear") is True:
        gear_count = sum(qty for r, qty in allocated_items if _matches(r, "gear", "rescue", "stretcher", "equipment"))
        if gear_count < 1:
            errors.append("Procedure specifies 'heavy_rescue_gear': true, but no heavy rescue gear/equipment was allocated.")

    # 4. First Aid Kits
    if "first_aid_kits" in procedure_payload:
        required_kits = int(procedure_payload["first_aid_kits"])
        kit_count = sum(qty for r, qty in allocated_items if _matches(r, "first aid", "first_aid", "kit"))
        if kit_count < required_kits:
            errors.append(f"Procedure requires {required_kits} first_aid_kits, but only {kit_count} were allocated.")

    # 5. Food & Water Rations
    if "food_water_rations" in procedure_payload:
        required_rations = int(procedure_payload["food_water_rations"])
        ration_count = sum(qty for r, qty in allocated_items if _matches(r, "ration", "water", "food"))
        if ration_count < required_rations:
            errors.append(f"Procedure requires {required_rations} food_water_rations, but only {ration_count} were allocated.")

    # 6. Drone Payload
    if procedure_payload.get("drone_payload") is True:
        drone_count = sum(qty for r, qty in allocated_items if _matches(r, "drone"))
        ration_count = sum(qty for r, qty in allocated_items if _matches(r, "ration", "water", "food"))
        if drone_count < 1 and ration_count < 1:
            errors.append("Procedure specifies 'drone_payload': true, but neither drone units nor payload items were allocated.")

    # 7. Engineering Team
    if "engineering_team" in procedure_payload:
        required_engineers = int(procedure_payload["engineering_team"])
        engineer_count = sum(qty for r, qty in allocated_items if _matches(r, "engineer"))
        if engineer_count < required_engineers:
            errors.append(f"Procedure requires {required_engineers} engineering_team member(s), but only {engineer_count} were allocated.")

    # 8. Barricades
    if "barricades" in procedure_payload:
        required_barricades = int(procedure_payload["barricades"])
        barricade_count = sum(qty for r, qty in allocated_items if _matches(r, "barricade", "barrier"))
        if barricade_count < required_barricades:
            errors.append(f"Procedure requires {required_barricades} barricades, but only {barricade_count} were allocated.")

    passed = len(errors) == 0
    details = (
        "Allocated resources fully satisfy all procedure constraints and capacity requirements."
        if passed
        else f"Procedure compliance failed with {len(errors)} unmet requirement(s)."
    )
    return passed, details, errors


# ---------------------------------------------------------------------------
# Public Entry Point
# ---------------------------------------------------------------------------

async def validate_ai_plan(snapshot_id: Union[str, UUID]) -> Dict[str, Any]:
    """
    Step 6 of the AI Decision Pipeline.
    1. Fetches snapshot_data, procedure_payload, and ai_proposed_plan from decision_snapshots.
    2. Executes 3 deterministic validation checks against the new directive schema:
       - Check 1: Schema Integrity (directive_id, action_type, recommendation fields, confidence_score)
       - Check 2: Resource Availability (allocated_resources items exist and have stock)
       - Check 3: Procedure Compliance (capacity, medic, gear, ration math)
    3. Aggregates results into an auditable pass/fail record.
    4. Updates decision_snapshots (validation_result, status='validated'|'rejected', updated_at).
    5. Returns the validation dictionary.

    Raises:
        ValueError: If snapshot is not found in the database.
    """
    client = await get_async_supabase_client()
    snapshot_id_str = str(snapshot_id)

    # 1. Fetch snapshot data
    snap_res = (
        await client.table("decision_snapshots")
        .select("snapshot_data, procedure_payload, ai_proposed_plan")
        .eq("id", snapshot_id_str)
        .execute()
    )
    if not snap_res.data or len(snap_res.data) == 0:
        raise ValueError(f"Decision snapshot '{snapshot_id_str}' not found.")

    snap_row = snap_res.data[0]
    snapshot_data: Dict[str, Any] = snap_row.get("snapshot_data") or {}
    procedure_payload: Dict[str, Any] = snap_row.get("procedure_payload") or {}
    ai_proposed_plan: Any = snap_row.get("ai_proposed_plan")

    all_errors: List[str] = []
    checks: List[Dict[str, Any]] = []

    # 2. Check 1: Schema Integrity
    ch1_passed, ch1_details, ch1_errors = _validate_schema_integrity(ai_proposed_plan)
    checks.append({"name": "schema_integrity", "passed": ch1_passed, "details": ch1_details})
    all_errors.extend(ch1_errors)

    # Extract allocated_resources using the new nested path
    allocated_resources: List[Dict[str, Any]] = []
    if ch1_passed:
        allocated_resources = _extract_allocated_resources(ai_proposed_plan)

    # 3. Check 2: Resource Availability
    ch2_passed, ch2_details, ch2_errors = _validate_resource_availability(allocated_resources, snapshot_data)
    checks.append({"name": "resource_availability", "passed": ch2_passed, "details": ch2_details})
    all_errors.extend(ch2_errors)

    # 4. Check 3: Procedure & Capacity Compliance
    ch3_passed, ch3_details, ch3_errors = _validate_procedure_compliance(
        allocated_resources, procedure_payload, snapshot_data
    )
    checks.append({"name": "procedure_compliance", "passed": ch3_passed, "details": ch3_details})
    all_errors.extend(ch3_errors)

    # 5. Determine overall result
    is_valid = ch1_passed and ch2_passed and ch3_passed and len(all_errors) == 0
    now_iso = datetime.now(timezone.utc).isoformat()
    new_status = "validated" if is_valid else "rejected"

    validation_result: Dict[str, Any] = {
        "valid": is_valid,
        "checks": checks,
        "errors": all_errors,
        "validated_at": now_iso,
    }

    # 6. Persist to decision_snapshots
    try:
        await client.table("decision_snapshots").update({
            "validation_result": validation_result,
            "status": new_status,
            "updated_at": now_iso,
        }).eq("id", snapshot_id_str).execute()
        logger.info(
            f"Snapshot {snapshot_id_str} validated: valid={is_valid}, status='{new_status}', errors={len(all_errors)}"
        )
    except Exception as exc:
        logger.error(f"Failed to update decision_snapshots with validation result for {snapshot_id_str}: {exc}")
        raise

    return validation_result
