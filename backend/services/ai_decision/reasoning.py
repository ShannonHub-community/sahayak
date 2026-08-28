"""
AI Decision System - Reasoning Module (Step 5 of Pipeline & Intelligence Chat)
STRICT RULE: This is the ONLY file in the ai_decision service permitted to call the Lyzr AI API.
Contains no validation logic, no deterministic math, no fallback plans.

Pipeline position: After snapshot.py and procedure.py have run.
Contract:
  - Reads `snapshot_data` and `procedure_id` from `decision_snapshots`.
  - Reads `required_resources` and `procedure_notes` from `response_procedures`.
  - Sends a single structured prompt to the Lyzr AI agent.
  - Forces the new directive JSON schema via system prompt + response_format=json_object.
  - Writes the parsed JSON directive into `ai_proposed_plan` on `decision_snapshots`.
  - Returns the parsed directive dict to the caller (orchestrator.py).

Conversational Chat:
  - `generate_chat_response(user_message: str)`: Provides live intelligence assistant answers
    grounded in real-time Supabase telemetry.
"""

import json
import logging
import os
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

import httpx

from shared.supabase import get_async_supabase_client

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lyzr REST API constants
# ---------------------------------------------------------------------------
LYZR_BASE_URL = "https://agent-prod.studio.lyzr.ai"
LYZR_CREATE_AGENT_URL = f"{LYZR_BASE_URL}/v3/agents/"
LYZR_CHAT_URL = f"{LYZR_BASE_URL}/v3/inference/chat/"

_AGENT_NAME = "Sahayak Disaster Response Logistics Expert"
_AGENT_DESCRIPTION = (
    "An expert AI agent for flood disaster response logistics. "
    "Analyses environmental snapshots, resource inventories, and workforce data "
    "to produce a structured operational dispatch directive for field commanders."
)

_CHAT_AGENT_NAME = "Sahayak Disaster Intelligence Assistant"
_CHAT_AGENT_DESCRIPTION = (
    "A conversational intelligence assistant providing real-time situation summaries "
    "and answers to field commanders based on live telemetry."
)

# ---------------------------------------------------------------------------
# Exact output schema — embedded verbatim in the system prompt
# ---------------------------------------------------------------------------
_OUTPUT_SCHEMA = """\
{
  "directive_id": "AI-DIR-[random 4-digit number, e.g. AI-DIR-8042]",
  "timestamp": "<current UTC time in ISO-8601 format, e.g. 2026-08-04T14:05:00Z>",
  "priority_level": "<exactly one of: CRITICAL | HIGH | MEDIUM | LOW — derive from incident data>",
  "incident_ref": "<the incident ID provided in the snapshot>",
  "action_type": "DISPATCH_WORKFORCE",
  "recommendation": {
    "target_unit_id": "<ID of the most suitable workforce unit or shelter from the snapshot>",
    "target_unit_name": "<Full name/description of that unit>",
    "destination_ward": "<Location string — ward, zone, or address nearest the incident>",
    "allocated_resources": [
      { "item_id": "<resource UUID or ID from snapshot>", "name": "<Resource Name>", "quantity": <integer> }
    ]
  },
  "ai_reasoning": "<Concise, instruction-grounded explanation. Reference specific distances, statuses, and capacities from snapshot_data.>",
  "confidence_score": <integer between 0 and 100>
}"""

_SYSTEM_PROMPT_TEMPLATE = """\
You are a Disaster Response Logistics Expert specialising in flood emergency management.
Your ONLY task is to produce a single, valid JSON directive. You MUST NOT output any text
outside the JSON object — no markdown fences, no prose, no commentary, no explanation.

## REQUIRED OUTPUT SCHEMA (strict — do not add or remove fields)
{output_schema}

## OPERATIONAL CONSTRAINTS
- action_type MUST always be exactly "DISPATCH_WORKFORCE".
- priority_level MUST be one of: CRITICAL, HIGH, MEDIUM, LOW (uppercase).
- confidence_score MUST be an integer from 0 to 100 (no decimals, no %).
- allocated_resources MUST only contain items that appear in the snapshot's resource inventory.
- target_unit_id and target_unit_name MUST reference a real workforce or shelter unit visible in the snapshot.
- If a required resource is unavailable, include it with quantity 0 and explain in ai_reasoning.
- Do NOT invent resource IDs, unit names, or ward labels not present in the input data.
- directive_id MUST follow the pattern: AI-DIR-XXXX where XXXX is a random 4-digit number.
"""

_CHAT_SYSTEM_PROMPT = (
    "You are a disaster response intelligence assistant for the Sahayak emergency management system. "
    "Use the provided live database context to answer the user's question concisely. "
    "When answering, explicitly reference specific landmark names, depth numbers, workforce units, and statuses "
    "provided in the context to ground your answer in the data. "
    "Do not use JSON formatting; reply in clean, readable text."
)


def _build_user_prompt(
    snapshot_data: Dict[str, Any],
    required_resources: Dict[str, Any],
    procedure_notes: str,
    incident_ref: str,
) -> str:
    """
    Constructs the user-turn message combining:
    - live environment state from the frozen snapshot
    - baseline resource requirements from the matched procedure
    - scenario constraints from procedure_notes
    - explicit mandatory allocation rules matching procedure requirements
    - a concrete output skeleton the AI must fill in
    """
    incident = snapshot_data.get("incident", {})
    resources = snapshot_data.get("resources", [])
    workforce = snapshot_data.get("workforce", [])
    risk_scores = snapshot_data.get("risk_scores", [])
    captured_at = snapshot_data.get("captured_at", "unknown")

    first_workforce = workforce[0] if workforce else {}
    example_unit_id = str(first_workforce.get("id", first_workforce.get("unit_id", "unit-001")))
    example_unit_name = str(first_workforce.get("unit_name", first_workforce.get("name", "Response Unit 1")))
    example_ward = str(incident.get("ward", incident.get("location", "Ward 1 (Old Panvel)")))
    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    dir_num = random.randint(1000, 9999)

    # 1. Helper to find matching available resource from snapshot
    def find_matching_res(*keywords: str) -> Optional[Dict[str, Any]]:
        for r in resources:
            if not isinstance(r, dict):
                continue
            haystack = f"{r.get('name', '')} {r.get('subtype', '')} {r.get('category', '')}".lower()
            if any(kw.lower() in haystack for kw in keywords) and str(r.get("status", "available")).lower() == "available":
                return r
        return None

    # 2. Inspect required_resources and build mandatory rules + sample allocations
    req_rules: List[str] = []
    sample_allocated: List[Dict[str, Any]] = []

    if required_resources and isinstance(required_resources, dict):
        if "food_water_rations" in required_resources:
            qty_req = int(required_resources["food_water_rations"])
            req_rules.append(
                f"- food_water_rations: {qty_req} -> You MUST include an item with name containing 'Ration', 'Food', or 'Water' and quantity >= {qty_req} in `allocated_resources`."
            )
            matched_res = find_matching_res("ration", "food", "water")
            if matched_res:
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-ration")),
                    "name": str(matched_res.get("name", "Emergency Food & Water Pack")),
                    "quantity": qty_req,
                })

        if "boat_capacity" in required_resources:
            cap_req = int(required_resources["boat_capacity"])
            req_rules.append(
                f"- boat_capacity: {cap_req} -> You MUST include boats (e.g. inflatable rescue boat) with combined capacity >= {cap_req} in `allocated_resources`."
            )
            matched_res = find_matching_res("boat")
            if matched_res:
                unit_cap = int(matched_res.get("capacity") or 5)
                needed_qty = max(1, (cap_req + unit_cap - 1) // unit_cap)
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-boat")),
                    "name": str(matched_res.get("name", "Inflatable Motor Rescue Boat")),
                    "quantity": needed_qty,
                })

        if required_resources.get("medic_required") is True:
            req_rules.append(
                "- medic_required: true -> You MUST include a medical unit / medic kit (name containing 'Medic', 'Medical', or 'Trauma') in `allocated_resources` with quantity >= 1."
            )
            matched_res = find_matching_res("medic", "medical", "paramedic", "trauma")
            if matched_res and not any(s["item_id"] == str(matched_res.get("id")) for s in sample_allocated):
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-med")),
                    "name": str(matched_res.get("name", "Trauma Medical Kit")),
                    "quantity": 1,
                })

        if required_resources.get("heavy_rescue_gear") is True:
            req_rules.append(
                "- heavy_rescue_gear: true -> You MUST include heavy rescue gear / equipment (name containing 'Gear', 'Rescue', 'Stretcher', or 'Equipment') with quantity >= 1."
            )
            matched_res = find_matching_res("gear", "rescue", "stretcher", "equipment")
            if matched_res and not any(s["item_id"] == str(matched_res.get("id")) for s in sample_allocated):
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-gear")),
                    "name": str(matched_res.get("name", "Heavy Rescue Equipment Kit")),
                    "quantity": 1,
                })

        if "first_aid_kits" in required_resources:
            fa_req = int(required_resources["first_aid_kits"])
            req_rules.append(
                f"- first_aid_kits: {fa_req} -> You MUST include first aid kits with quantity >= {fa_req} in `allocated_resources`."
            )
            matched_res = find_matching_res("first aid", "first_aid", "kit")
            if matched_res and not any(s["item_id"] == str(matched_res.get("id")) for s in sample_allocated):
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-fa")),
                    "name": str(matched_res.get("name", "First Aid Kit Type-A")),
                    "quantity": fa_req,
                })

        if required_resources.get("drone_payload") is True:
            req_rules.append(
                "- drone_payload: true -> You MUST include drone units or payload items with quantity >= 1."
            )
            matched_res = find_matching_res("drone", "payload")
            if matched_res and not any(s["item_id"] == str(matched_res.get("id")) for s in sample_allocated):
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-drone")),
                    "name": str(matched_res.get("name", "Surveillance & Payload Drone")),
                    "quantity": 1,
                })

        if "engineering_team" in required_resources:
            eng_req = int(required_resources["engineering_team"])
            req_rules.append(
                f"- engineering_team: {eng_req} -> You MUST include engineering team items (name containing 'Engineer') with quantity >= {eng_req} in `allocated_resources`."
            )
            matched_res = find_matching_res("engineer")
            if matched_res and not any(s["item_id"] == str(matched_res.get("id")) for s in sample_allocated):
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-eng")),
                    "name": str(matched_res.get("name", "Civil Engineering Repair Team")),
                    "quantity": eng_req,
                })

        if "barricades" in required_resources:
            bar_req = int(required_resources["barricades"])
            req_rules.append(
                f"- barricades: {bar_req} -> You MUST include barricades/barriers with quantity >= {bar_req} in `allocated_resources`."
            )
            matched_res = find_matching_res("barricade", "barrier")
            if matched_res and not any(s["item_id"] == str(matched_res.get("id")) for s in sample_allocated):
                sample_allocated.append({
                    "item_id": str(matched_res.get("id", "res-bar")),
                    "name": str(matched_res.get("name", "Mobile Water Barrier")),
                    "quantity": bar_req,
                })

    if not sample_allocated:
        first_res = resources[0] if resources else {}
        sample_allocated.append({
            "item_id": str(first_res.get("id", "res-001")),
            "name": str(first_res.get("name", "Emergency Medical Kit")),
            "quantity": 1,
        })

    formatted_rules = "\n".join(req_rules) if req_rules else "- Standard dispatch: allocate appropriate resources from inventory."
    sample_allocated_json = json.dumps(sample_allocated, indent=6)

    return f"""\
## LIVE SNAPSHOT (captured at {captured_at})
Incident Reference ID: {incident_ref}

### Incident Details
{json.dumps(incident, indent=2, default=str)}

### Available Resources Inventory
{json.dumps(resources, indent=2, default=str)}

### Current Workforce Assignments
{json.dumps(workforce, indent=2, default=str)}

### Flood Risk Scores
{json.dumps(risk_scores, indent=2, default=str)}

## PROCEDURE REQUIREMENTS

### Baseline Required Resources (from matched SOP)
{json.dumps(required_resources, indent=2, default=str)}

### Procedure Instructions / Constraints
{procedure_notes or "No additional instructions provided."}

## MANDATORY PROCEDURE ALLOCATION REQUIREMENTS
You MUST allocate resources in `recommendation.allocated_resources` that fulfill EVERY item listed below:
{formatted_rules}

CRITICAL RULES:
- Every allocated resource item MUST match an item from the "Available Resources Inventory" list above (using its exact item_id and name).
- If food_water_rations is required (e.g. quantity N), you MUST include an item with name containing 'Ration' or 'Food' or 'Water' and quantity >= N in `allocated_resources`.
- If boat_capacity is required (e.g. capacity N), ensure boats with combined capacity >= N are included in `allocated_resources`.
- If medic_required is true, ensure a medical unit / medic item is included in `allocated_resources`.
- If barricades or engineering_team are required, include them with their required quantities in `allocated_resources`.
- If heavy_rescue_gear, first_aid_kits, or drone_payload are specified, allocate the corresponding items with required quantities.
- Failure to allocate these mandatory items will cause automated validator rejection.

## YOUR TASK
Produce the directive JSON exactly as specified in your system instructions.
Every field is MANDATORY. Do NOT omit any field.
Use the incident reference ID "{incident_ref}" as the value for "incident_ref".

Here is the EXACT skeleton you MUST fill in — replace only the angle-bracket values while ensuring all procedure requirements are allocated:

{{
  "directive_id": "AI-DIR-{dir_num}",
  "timestamp": "{now_ts}",
  "priority_level": "<CRITICAL or HIGH or MEDIUM or LOW>",
  "incident_ref": "{incident_ref}",
  "action_type": "DISPATCH_WORKFORCE",
  "recommendation": {{
    "target_unit_id": "<pick best unit ID from workforce list, e.g. {example_unit_id}>",
    "target_unit_name": "<name of that unit, e.g. {example_unit_name}>",
    "destination_ward": "<incident location, e.g. {example_ward}>",
    "allocated_resources": {sample_allocated_json}
  }},
  "ai_reasoning": "<2-3 sentence explanation referencing distances, statuses, and capacities from the snapshot>",
  "confidence_score": 85
}}

Replace ALL angle-bracket placeholders with real values from the data above. Output ONLY this JSON.
"""


async def _create_lyzr_agent(api_key: str, http_client: httpx.AsyncClient) -> str:
    """
    Creates an ephemeral Lyzr agent with JSON-mode response_format and returns its agent_id.
    """
    payload = {
        "name": _AGENT_NAME,
        "description": _AGENT_DESCRIPTION,
        "system_prompt": _SYSTEM_PROMPT_TEMPLATE.format(output_schema=_OUTPUT_SCHEMA),
        "provider_id": "openai",
        "model": "gpt-4o-mini",
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "top_p": 0.9,
    }
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "accept": "application/json",
    }

    resp = await http_client.post(LYZR_CREATE_AGENT_URL, json=payload, headers=headers, timeout=30.0)

    if resp.status_code not in (200, 201):
        raise RuntimeError(
            f"Lyzr agent creation failed [{resp.status_code}]: {resp.text}"
        )

    data = resp.json()
    agent_id = data.get("agent_id") or data.get("id")
    if not agent_id:
        raise RuntimeError(
            f"Lyzr agent creation succeeded but returned no agent_id. Response: {data}"
        )

    logger.info(f"Lyzr ephemeral agent created: agent_id={agent_id}")
    return str(agent_id)


async def _create_lyzr_chat_agent(api_key: str, http_client: httpx.AsyncClient) -> str:
    """
    Creates an ephemeral conversational Lyzr agent (clean text response) and returns its agent_id.
    """
    payload = {
        "name": _CHAT_AGENT_NAME,
        "description": _CHAT_AGENT_DESCRIPTION,
        "system_prompt": _CHAT_SYSTEM_PROMPT,
        "provider_id": "openai",
        "model": "gpt-4o-mini",
        "temperature": 0.3,
        "top_p": 0.9,
    }
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "accept": "application/json",
    }

    resp = await http_client.post(LYZR_CREATE_AGENT_URL, json=payload, headers=headers, timeout=30.0)

    if resp.status_code not in (200, 201):
        raise RuntimeError(
            f"Lyzr chat agent creation failed [{resp.status_code}]: {resp.text}"
        )

    data = resp.json()
    agent_id = data.get("agent_id") or data.get("id")
    if not agent_id:
        raise RuntimeError(
            f"Lyzr chat agent creation succeeded but returned no agent_id. Response: {data}"
        )

    logger.info(f"Lyzr ephemeral chat agent created: agent_id={agent_id}")
    return str(agent_id)


async def _call_lyzr_inference(
    api_key: str,
    agent_id: str,
    user_message: str,
    session_id: str,
    http_client: httpx.AsyncClient,
) -> str:
    """
    Sends the user prompt to the Lyzr agent and returns the raw response string.
    """
    payload = {
        "user_id": "sahayak-ai-decision-system",
        "agent_id": agent_id,
        "session_id": session_id,
        "message": user_message,
    }
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "accept": "application/json",
    }

    resp = await http_client.post(LYZR_CHAT_URL, json=payload, headers=headers, timeout=60.0)

    if resp.status_code != 200:
        raise RuntimeError(
            f"Lyzr inference call failed [{resp.status_code}]: {resp.text}"
        )

    data = resp.json()
    raw_text = (
        data.get("response")
        or data.get("message")
        or data.get("content")
        or data.get("text")
        or ""
    )

    if not raw_text:
        raise RuntimeError(
            f"Lyzr inference returned an empty response body. Full payload: {data}"
        )

    return str(raw_text).strip()


def _parse_ai_json(raw_text: str) -> Dict[str, Any]:
    """
    Parses the raw AI output into a Python dict.
    Uses multiple strategies to extract JSON from potentially noisy AI output:
    1. Direct parse
    2. Strip markdown fences (```json ... ```)
    3. Regex extract first { ... } block
    Does NOT validate schema correctness — that is validator.py's job.
    """
    import re

    cleaned = raw_text.strip()

    # Strategy 1: Direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Strip markdown fences
    fence_pattern = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)
    fence_match = fence_pattern.search(cleaned)
    if fence_match:
        try:
            return json.loads(fence_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Strategy 3: Extract first JSON object { ... } using brace matching
    start_idx = cleaned.find("{")
    if start_idx != -1:
        depth = 0
        end_idx = start_idx
        for i in range(start_idx, len(cleaned)):
            if cleaned[i] == "{":
                depth += 1
            elif cleaned[i] == "}":
                depth -= 1
                if depth == 0:
                    end_idx = i
                    break
        if end_idx > start_idx:
            candidate = cleaned[start_idx : end_idx + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass

    raise ValueError(
        f"AI output is not valid JSON after 3 extraction strategies.\n"
        f"Raw output (first 500 chars): {cleaned[:500]}"
    )


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------

async def generate_ai_recommendation(
    snapshot_id: Union[str, UUID],
) -> Dict[str, Any]:
    """
    Step 5 of the AI Decision Pipeline.

    1. Fetches `snapshot_data`, `procedure_id`, and incident context from `decision_snapshots`.
    2. Fetches `required_resources` and `procedure_notes` from `response_procedures`.
    3. Creates an ephemeral Lyzr AI agent with JSON-mode enforced and the new directive schema.
    4. Constructs and sends a structured prompt to the Lyzr agent.
    5. Parses the raw JSON directive response.
    6. Updates `ai_proposed_plan` in `decision_snapshots`.
    7. Returns the parsed directive dict.

    Raises:
        ValueError: If the snapshot or procedure is not found, or if JSON parsing fails.
        RuntimeError: If the Lyzr API returns an error.
    """
    api_key = os.environ.get("LYZR_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "LYZR_API_KEY environment variable is not set. "
            "Add it to your .env file to enable AI recommendations."
        )

    client = await get_async_supabase_client()
    snapshot_id_str = str(snapshot_id)

    # 1. Fetch snapshot row
    snap_res = (
        await client.table("decision_snapshots")
        .select("incident_ref, snapshot_data, procedure_id, priority_level, injury_severity, disaster_type")
        .eq("id", snapshot_id_str)
        .execute()
    )
    if not snap_res.data:
        raise ValueError(f"Decision snapshot '{snapshot_id_str}' not found.")

    snap_row = snap_res.data[0]
    snapshot_data: Dict[str, Any] = snap_row.get("snapshot_data") or {}
    procedure_id = snap_row.get("procedure_id")
    incident_ref = snap_row.get("incident_ref") or snapshot_id_str

    if not procedure_id:
        raise ValueError(
            f"Snapshot '{snapshot_id_str}' has no linked procedure_id. "
            "Run procedure.py (match_and_attach_procedure) before generating AI recommendations."
        )

    # 2. Fetch matched procedure
    proc_res = (
        await client.table("response_procedures")
        .select("required_resources, procedure_notes")
        .eq("id", str(procedure_id))
        .execute()
    )
    if not proc_res.data:
        raise ValueError(f"Response procedure '{procedure_id}' not found in response_procedures table.")

    proc_row = proc_res.data[0]
    required_resources: Dict[str, Any] = proc_row.get("required_resources") or {}
    procedure_notes: str = proc_row.get("procedure_notes") or ""

    # 3-4. Build prompt and call Lyzr AI
    user_prompt = _build_user_prompt(snapshot_data, required_resources, procedure_notes, str(incident_ref))
    session_id = f"sahayak-decision-{snapshot_id_str}"

    async with httpx.AsyncClient() as http_client:
        agent_id = await _create_lyzr_agent(api_key, http_client)
        raw_text = await _call_lyzr_inference(api_key, agent_id, user_prompt, session_id, http_client)

    logger.debug(f"Raw Lyzr response for snapshot {snapshot_id_str}: {raw_text[:300]}")

    # 5. Parse — NO validation here; validator.py handles schema enforcement
    ai_directive = _parse_ai_json(raw_text)

    # 6. Persist to decision_snapshots
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        await client.table("decision_snapshots").update({
            "ai_proposed_plan": ai_directive,
            "updated_at": now_iso,
        }).eq("id", snapshot_id_str).execute()
    except Exception as exc:
        logger.error(f"Failed to persist ai_proposed_plan for snapshot {snapshot_id_str}: {exc}")
        raise

    logger.info(f"AI directive generated and persisted for snapshot {snapshot_id_str}.")
    return ai_directive


async def generate_chat_response(user_message: str) -> str:
    """
    Conversational Intelligence Assistant:
    1. Fetches a high-level summary of the live database state (active SOS incidents,
       available resource stock, active workforce, and risk scores).
    2. Builds a concise situation context block.
    3. Calls the Lyzr AI chat agent to produce a clean, readable text response.
    """
    api_key = os.environ.get("LYZR_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("LYZR_API_KEY environment variable is not set.")

    client = await get_async_supabase_client()

    # 1. Fetch high-level live state summary from ALL relevant tables
    sos_summary: Dict[str, Any] = {"count": 0}
    twin_summary: Dict[str, Any] = {"count": 0}
    resources_summary: Dict[str, Any] = {"count": 0}
    workforce_summary: Dict[str, Any] = {"count": 0}

    # Query sos_reports (may be empty)
    sos_lines = []
    try:
        sos_res = await client.table("sos_reports").select("*").limit(10).execute()
        if sos_res.data:
            sos_summary["count"] = len(sos_res.data)
            for s in sos_res.data:
                sos_lines.append(
                    f"- SOS: Status: {s.get('status', 'unknown')}, Data: {json.dumps(s, default=str)}"
                )
    except Exception as e:
        logger.warning(f"Chat context: failed to query sos_reports: {e}")

    # Query twin_state — this is where the actual map marker data lives
    twin_lines = []
    try:
        twin_res = await client.table("twin_state").select("*").limit(20).execute()
        if twin_res.data:
            twin_summary["count"] = len(twin_res.data)
            for t in twin_res.data:
                twin_lines.append(
                    f"- Entity: {t.get('entity_type')}, Status: {t.get('status')}, Severity: {t.get('severity_count')}, Data: {json.dumps(t, default=str)}"
                )
                
            # Merge SOS-type twin entities into sos_summary for coherent context
            sos_twins = [e for e in twin_res.data if e.get("entity_type") in ("sos_report", "sos")]
            if sos_twins and sos_summary["count"] == 0:
                sos_summary["count"] = len(sos_twins)
                for s in sos_twins:
                    sos_lines.append(
                        f"- Map SOS Marker: Status: {s.get('status')}, Data: {json.dumps(s, default=str)}"
                    )
    except Exception as e:
        logger.warning(f"Chat context: failed to query twin_state: {e}")

    # Query resources table
    res_lines = []
    try:
        res_res = await client.table("resources").select("*").eq("status", "available").limit(15).execute()
        if res_res.data:
            resources_summary["count"] = len(res_res.data)
            for r in res_res.data:
                res_lines.append(
                    f"- Resource: {r.get('name')}, Status: {r.get('status')}, Quantity: {r.get('quantity')}, Data: {json.dumps(r, default=str)}"
                )
    except Exception as e:
        logger.warning(f"Chat context: failed to query resources: {e}")

    # Query workforce_assignments table
    wf_lines = []
    try:
        wf_res = await client.table("workforce_assignments").select("*").limit(10).execute()
        if wf_res.data:
            workforce_summary["count"] = len(wf_res.data)
            for w in wf_res.data:
                wf_lines.append(
                    f"- Workforce Unit: {w.get('unit_name')}, Status: {w.get('status')}, Ward: {w.get('ward')}, Data: {json.dumps(w, default=str)}"
                )
    except Exception as e:
        logger.warning(f"Chat context: failed to query workforce_assignments: {e}")

    # Query risk_scores table
    risk_lines = []
    try:
        risk_res = await client.table("risk_scores").select("*").limit(10).execute()
        if risk_res.data:
            for r in risk_res.data:
                risk_lines.append(
                    f"- Risk Zone: Ward: {r.get('ward')}, Depth: {r.get('flood_depth')}, Severity: {r.get('severity')}, Data: {json.dumps(r, default=str)}"
                )
    except Exception as e:
        logger.warning(f"Chat context: failed to query risk_scores: {e}")

    sos_block = "\n".join(sos_lines) if sos_lines else "None"
    twin_block = "\n".join(twin_lines) if twin_lines else "None"
    res_block = "\n".join(res_lines) if res_lines else "None"
    wf_block = "\n".join(wf_lines) if wf_lines else "None"
    risk_block = "\n".join(risk_lines) if risk_lines else "None"

    # 2. Build contextual prompt for Lyzr agent
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    context_prompt = f"""\
LIVE DISASTER TELEMETRY & SITUATION CONTEXT ({now_str}):
- Active SOS Incidents ({sos_summary['count']}):
{sos_block}

- Digital Twin Map Entities ({twin_summary['count']}):
{twin_block}

- Available Depot Resources ({resources_summary['count']}):
{res_block}

- Workforce Units ({workforce_summary['count']}):
{wf_block}

- Monitored Risk Zones:
{risk_block}

OFFICER QUESTION:
"{user_message}"

INSTRUCTIONS:
Answer the officer's question accurately and concisely based on the live context above. Note that for flood markers in twin_state, severity counts like 42 or 26 often denote depth in decimeters (e.g. 42 = 4.2m). Reference specific landmarks, locations, depths, and resource figures from the data. Do NOT format your reply as JSON. Reply with clear, professional plain text or markdown bullets if helpful.
"""

    session_id = f"sahayak-chat-session-{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"

    # 3. Call Lyzr AI conversational agent
    async with httpx.AsyncClient() as http_client:
        agent_id = await _create_lyzr_chat_agent(api_key, http_client)
        reply_text = await _call_lyzr_inference(api_key, agent_id, context_prompt, session_id, http_client)

    return reply_text
