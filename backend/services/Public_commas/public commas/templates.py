"""
Minimal template lookup for Sub-Tab 2.

Replace this with a real template-management table/service (e.g. an
admin-editable `press_templates` DB table) — this stub exists so `press.py`
has exactly one function (`get_template`) to swap out, without press.py
needing to know whether templates live in Postgres, S3, or a CMS.
"""
from __future__ import annotations

# Placeholder in-memory catalogue. Each template gives the AI model a
# structural skeleton (sections/tone) to follow, not literal boilerplate text
# — the model still has to fill it in from real audit trail data.
_TEMPLATES: dict[str, dict] = {
    "flood-status-update": {
        "name": "Routine Flood Status Update",
        "tone": "calm, informative",
        "sections": ["headline", "current situation", "response actions taken", "public guidance"],
    },
    "rescue-operation-summary": {
        "name": "Rescue Operation Summary",
        "tone": "measured, factual",
        "sections": ["headline", "summary of operations", "figures (people rescued/assisted)", "next steps"],
    },
    "evacuation-notice": {
        "name": "Evacuation Notice",
        "tone": "urgent but clear",
        "sections": ["headline", "affected areas", "required action", "timeline", "contact/help info"],
    },
}


async def get_template(template_id: str) -> dict | None:
    return _TEMPLATES.get(template_id)


async def list_templates() -> list[dict]:
    return [{"id": tid, **t} for tid, t in _TEMPLATES.items()]
