"""
ai_client.py
============

Single point of contact with the shared AI model API (the same backend
used by the AI Decision System elsewhere in the platform). Every prompt,
retry policy, and response-parsing rule for the news_report service lives
here so alerts.py / press.py / timeline.py stay free of prompt-engineering
detail and just call a typed function.

All three call sites go through `_call_model`, which:
  - applies a timeout
  - retries transient failures (timeouts, 429, 5xx) with exponential backoff
  - never lets a malformed AI response silently corrupt downstream state -
    callers get a `AIClientError` they can catch and turn into a draft-failed
    / entry-skipped state rather than crashing the request.
"""
from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any

import httpx

from .config import AIModelConfig, ai_model_config

logger = logging.getLogger("news_report.ai_client")


class AIClientError(RuntimeError):
    """Raised when the shared AI model cannot produce a usable result."""


@dataclass
class AlertDraft:
    message: str


@dataclass
class PressDraft:
    title: str
    body: str


@dataclass
class TimelineFormat:
    title: str
    body: str


class AIClient:
    """Thin async wrapper around the shared AI model's /v1/messages endpoint."""

    def __init__(self, config: AIModelConfig | None = None):
        self.config = config or ai_model_config
        if self.config is None:
            raise RuntimeError(
                "AIClient: AI_MODEL_API_URL / AI_MODEL_API_KEY are not configured"
            )

    async def _call_model(
        self,
        *,
        system: str,
        user_prompt: str,
        max_tokens: int = 800,
        expect_json: bool = False,
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.config.model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user_prompt}],
        }

        last_err: Exception | None = None
        async with httpx.AsyncClient(
            base_url=self.config.base_url, timeout=self.config.timeout_s
        ) as client:
            for attempt in range(1, self.config.max_retries + 1):
                try:
                    resp = await client.post("/v1/messages", json=payload, headers=headers)
                    if resp.status_code == 429 or resp.status_code >= 500:
                        raise httpx.HTTPStatusError(
                            f"retryable status {resp.status_code}",
                            request=resp.request,
                            response=resp,
                        )
                    resp.raise_for_status()
                    data = resp.json()
                    text = "".join(
                        block.get("text", "")
                        for block in data.get("content", [])
                        if block.get("type") == "text"
                    ).strip()
                    if not text:
                        raise AIClientError("AI model returned no text content")
                    if expect_json:
                        _strip_and_validate_json(text)  # raises AIClientError if invalid
                    return text
                except (httpx.TransportError, httpx.HTTPStatusError, AIClientError) as exc:
                    last_err = exc
                    logger.warning(
                        "news_report.ai_client: attempt %s/%s failed: %s",
                        attempt,
                        self.config.max_retries,
                        exc,
                    )
                    if attempt < self.config.max_retries:
                        await asyncio.sleep(min(2 ** attempt, 8))
                    continue

        raise AIClientError(f"AI model call failed after retries: {last_err}") from last_err

    # ------------------------------------------------------------ Sub-Tab 1

    async def draft_sms_alert(self, zone_id: str, zone_data: dict[str, Any]) -> AlertDraft:
        """
        Draft a public flood-alert SMS from live Flood Engine / Digital Twin
        data for one zone. Kept short and action-oriented for SMS delivery.
        """
        system = (
            "You are drafting an emergency public SMS flood alert for a specific "
            "geofenced zone. Write in plain, urgent, non-technical language. "
            "State the risk level, the recommended action, and (if present in the "
            "data) an evacuation route or shelter reference. "
            "Hard limit: 320 characters (2 SMS segments). No hashtags, no emoji, "
            "no markdown. Output ONLY the SMS text, nothing else."
        )
        user_prompt = (
            f"Zone ID: {zone_id}\n"
            f"Flood Engine / Digital Twin data (JSON):\n{json.dumps(zone_data, default=str)}"
        )
        text = await self._call_model(system=system, user_prompt=user_prompt, max_tokens=200)
        message = text.strip()
        if len(message) > 320:
            message = message[:317].rstrip() + "..."
        return AlertDraft(message=message)

    # ------------------------------------------------------------ Sub-Tab 2

    async def draft_press_release(
        self, template_id: str, template: dict[str, Any], audit_data: list[dict[str, Any]]
    ) -> PressDraft:
        """
        Draft a press release from a template plus a window of audit-trail
        data (e.g. workforce rescue logs). Returns structured title + body.
        """
        system = (
            "You are drafting an official press release for a disaster-response "
            "agency, following the structure and tone of the given template. "
            "Use only facts present in the supplied audit trail data - do not "
            "invent figures, names, or outcomes. "
            'Respond with ONLY a JSON object of the form {"title": "...", "body": "..."} '
            "and nothing else - no markdown fences, no commentary."
        )
        user_prompt = (
            f"Template ID: {template_id}\n"
            f"Template (JSON):\n{json.dumps(template, default=str)}\n\n"
            f"Audit trail data for the reporting window (JSON):\n"
            f"{json.dumps(audit_data, default=str)}"
        )
        text = await self._call_model(
            system=system, user_prompt=user_prompt, max_tokens=1200, expect_json=True
        )
        parsed = _strip_and_validate_json(text)
        title = str(parsed.get("title", "")).strip()
        body = str(parsed.get("body", "")).strip()
        if not title or not body:
            raise AIClientError("Press release draft missing title or body")
        return PressDraft(title=title, body=body)

    # ------------------------------------------------------------ Sub-Tab 3

    async def format_timeline_entry(self, event: dict[str, Any]) -> TimelineFormat:
        """
        Turn one raw audit-trail / Twin Aggregator event into a short,
        public-friendly timeline headline + body. Must never expose
        internal-only fields (system IDs, internal notes) verbatim.
        """
        system = (
            "You convert one internal disaster-response audit-trail or digital-twin "
            "event into a short public timeline entry, safe for citizens to read. "
            "Do not include internal system identifiers, staff names, or internal "
            "notes. Be factual and neutral. "
            'Respond with ONLY a JSON object of the form {"title": "...", "body": "..."} '
            "and nothing else. Title under 100 characters, body under 400 characters."
        )
        user_prompt = f"Event (JSON):\n{json.dumps(event, default=str)}"
        text = await self._call_model(
            system=system, user_prompt=user_prompt, max_tokens=400, expect_json=True
        )
        parsed = _strip_and_validate_json(text)
        title = str(parsed.get("title", "")).strip()
        body = str(parsed.get("body", "")).strip()
        if not title or not body:
            raise AIClientError("Timeline formatting missing title or body")
        return TimelineFormat(title=title[:100], body=body[:400])


def _strip_and_validate_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIClientError(f"AI model did not return valid JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise AIClientError("AI model JSON response was not an object")
    return parsed


_client_singleton: AIClient | None = None


def get_ai_client() -> AIClient:
    global _client_singleton
    if _client_singleton is None:
        _client_singleton = AIClient()
    return _client_singleton
