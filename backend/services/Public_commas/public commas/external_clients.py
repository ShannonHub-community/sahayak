"""
Thin async clients for every external system this service talks to.
Kept separate from alerts.py/press.py/timeline.py so retry/auth/timeout
policy for each downstream system lives in exactly one place, and so the
business-logic files can be unit tested against fakes of these classes.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from .config import (
    AuditTrailConfig,
    CitizenPortalConfig,
    DigitalTwinConfig,
    PressPortalConfig,
    SMSGatewayConfig,
    audit_trail_config,
    citizen_portal_config,
    digital_twin_config,
    press_portal_config,
    sms_gateway_config,
)

logger = logging.getLogger("news_report.external_clients")


class ExternalServiceError(RuntimeError):
    """Raised when a downstream integration fails after retries."""


async def _post_with_retry(
    client: httpx.AsyncClient, path: str, *, json: dict, headers: dict, max_retries: int
) -> httpx.Response:
    last_err: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = await client.post(path, json=json, headers=headers)
            if resp.status_code == 429 or resp.status_code >= 500:
                raise httpx.HTTPStatusError(
                    f"retryable status {resp.status_code}", request=resp.request, response=resp
                )
            resp.raise_for_status()
            return resp
        except (httpx.TransportError, httpx.HTTPStatusError) as exc:
            last_err = exc
            logger.warning("news_report: POST %s attempt %s/%s failed: %s", path, attempt, max_retries, exc)
            if attempt < max_retries:
                await asyncio.sleep(min(2 ** attempt, 8))
    raise ExternalServiceError(f"POST {path} failed after {max_retries} attempts: {last_err}")


# --------------------------------------------------------------- Digital Twin

class DigitalTwinClient:
    """Read-only access to live Flood Engine / Digital Twin zone state."""

    def __init__(self, config: DigitalTwinConfig | None = None):
        self.config = config or digital_twin_config
        if self.config is None:
            raise RuntimeError("DigitalTwinClient: DIGITAL_TWIN_API_URL is not configured")

    async def get_zone_flood_data(self, zone_id: str) -> dict[str, Any]:
        """
        Latest Flood Engine + Twin state for a zone: water level, risk
        tier, forecast trend, affected population estimate, evac routes, etc.
        Raises ExternalServiceError (incl. on 404 unknown zone).
        """
        headers = {"Authorization": f"Bearer {self.config.api_key}"} if self.config.api_key else {}
        async with httpx.AsyncClient(base_url=self.config.base_url, timeout=self.config.timeout_s) as client:
            try:
                resp = await client.get(f"/zones/{zone_id}/flood-state", headers=headers)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 404:
                    raise ExternalServiceError(f"Unknown zone_id: {zone_id}") from exc
                raise ExternalServiceError(f"Digital Twin lookup failed for {zone_id}: {exc}") from exc
            except httpx.TransportError as exc:
                raise ExternalServiceError(f"Digital Twin unreachable: {exc}") from exc


# ---------------------------------------------------------------- SMS Gateway

class SMSGatewayClient:
    """Sends geofenced broadcast SMS via the platform's Communication Layer."""

    def __init__(self, config: SMSGatewayConfig | None = None):
        self.config = config or sms_gateway_config
        if self.config is None:
            raise RuntimeError("SMSGatewayClient: SMS_GATEWAY_URL is not configured")

    async def send_geofenced_broadcast(self, zone_id: str, message: str) -> str:
        """
        Sends `message` to every subscriber inside the geofence for `zone_id`.
        Returns the gateway's broadcast reference id for later status lookup.
        """
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        payload = {"target": {"type": "geofence_zone", "zone_id": zone_id}, "message": message}
        async with httpx.AsyncClient(base_url=self.config.base_url, timeout=self.config.timeout_s) as client:
            resp = await _post_with_retry(
                client, "/broadcasts", json=payload, headers=headers, max_retries=self.config.max_retries
            )
            data = resp.json()
            ref = data.get("broadcast_id") or data.get("id")
            if not ref:
                raise ExternalServiceError("SMS Gateway response missing broadcast id")
            return str(ref)


# -------------------------------------------------------------- Press Portal

class PressPortalClient:
    """Publishes a finalized press release to the external Press Portal."""

    def __init__(self, config: PressPortalConfig | None = None):
        self.config = config or press_portal_config
        if self.config is None:
            raise RuntimeError("PressPortalClient: PRESS_PORTAL_URL is not configured")

    async def publish(self, title: str, body: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        payload = {"title": title, "body": body}
        async with httpx.AsyncClient(base_url=self.config.base_url, timeout=self.config.timeout_s) as client:
            resp = await _post_with_retry(
                client, "/releases", json=payload, headers=headers, max_retries=self.config.max_retries
            )
            data = resp.json()
            ref = data.get("release_id") or data.get("id")
            if not ref:
                raise ExternalServiceError("Press Portal response missing release id")
            return str(ref)


# --------------------------------------------------------------- Audit Trail

class AuditTrailClient:
    """Read access to historical audit-trail data (e.g. Workforce rescue logs)."""

    def __init__(self, config: AuditTrailConfig | None = None):
        self.config = config or audit_trail_config
        if self.config is None:
            raise RuntimeError("AuditTrailClient: AUDIT_TRAIL_API_URL is not configured")

    async def get_events_in_window(
        self, *, start, end, event_types: list[str] | None = None
    ) -> list[dict[str, Any]]:
        """
        Pulls audit-trail entries (e.g. workforce rescue logs) for a time
        window, for Sub-Tab 2 press release drafting.
        """
        headers = {"Authorization": f"Bearer {self.config.api_key}"} if self.config.api_key else {}
        params: dict[str, Any] = {"start": start.isoformat(), "end": end.isoformat()}
        if event_types:
            params["event_type"] = ",".join(event_types)
        async with httpx.AsyncClient(base_url=self.config.base_url, timeout=self.config.timeout_s) as client:
            try:
                resp = await client.get("/audit-trail/events", params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                return data.get("events", data if isinstance(data, list) else [])
            except httpx.HTTPStatusError as exc:
                raise ExternalServiceError(f"Audit trail lookup failed: {exc}") from exc
            except httpx.TransportError as exc:
                raise ExternalServiceError(f"Audit trail unreachable: {exc}") from exc


class AuditTrailEventBus:
    """
    Subscriber for the live audit-trail / Twin Aggregator event stream that
    feeds Sub-Tab 3. Assumes a Redis pub/sub channel per config.event_bus_url
    / config.event_channel; swap the transport here (Kafka, SNS, etc.) without
    touching timeline.py, which only depends on the `subscribe()` interface.
    """

    def __init__(self, config: AuditTrailConfig | None = None):
        self.config = config or audit_trail_config
        if self.config is None:
            raise RuntimeError("AuditTrailEventBus: EVENT_BUS_URL is not configured")

    async def subscribe(self):
        """
        Async generator yielding each new event dict as it's published.
        Reconnects with backoff on transport errors so a transient Redis
        blip doesn't permanently kill the Sub-Tab 3 listener.
        """
        import redis.asyncio as aioredis  # local import: optional dependency

        backoff = 1
        while True:
            try:
                redis_client = aioredis.from_url(self.config.event_bus_url)
                pubsub = redis_client.pubsub()
                await pubsub.subscribe(self.config.event_channel)
                backoff = 1
                async for message in pubsub.listen():
                    if message["type"] != "message":
                        continue
                    import json

                    try:
                        yield json.loads(message["data"])
                    except (TypeError, ValueError) as exc:
                        logger.error("news_report: dropped unparseable event bus message: %s", exc)
                        continue
            except Exception as exc:  # noqa: BLE001 - must never let the listener die silently
                logger.error("news_report: event bus subscription error, reconnecting: %s", exc)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)


# ------------------------------------------------------------- Citizen Portal

class CitizenPortalFeed:
    """
    Fan-out of the public news_timeline feed to the Citizen Portal's
    "New Report" tab: an in-process websocket broadcast for connected
    clients, plus a best-effort resync webhook so any client that missed
    the live push (or a server not holding that websocket) still converges.
    """

    def __init__(self, config: CitizenPortalConfig | None = None):
        self.config = config or citizen_portal_config
        self._websocket_clients: set[Any] = set()  # populated by router.py on connect

    def register_client(self, ws: Any) -> None:
        self._websocket_clients.add(ws)

    def unregister_client(self, ws: Any) -> None:
        self._websocket_clients.discard(ws)

    async def push_entry(self, entry_payload: dict[str, Any]) -> None:
        """Push one new/updated visible timeline entry to all live clients."""
        await self._broadcast({"type": "timeline_entry", "entry": entry_payload})

    async def push_resync(self, visible_entries: list[dict[str, Any]]) -> None:
        """
        Full resync: sent after a visibility toggle so every connected
        client's feed reflects exactly the current set of visible entries
        (rather than trying to diff a single show/hide event).
        """
        await self._broadcast({"type": "timeline_resync", "entries": visible_entries})
        if self.config and self.config.resync_webhook_url:
            await self._notify_resync_webhook(visible_entries)

    async def _broadcast(self, payload: dict[str, Any]) -> None:
        if not self._websocket_clients:
            return
        dead = []
        for ws in self._websocket_clients:
            try:
                await ws.send_json(payload)
            except Exception as exc:  # noqa: BLE001 - one bad socket must not break the rest
                logger.warning("news_report: dropping dead citizen-portal socket: %s", exc)
                dead.append(ws)
        for ws in dead:
            self._websocket_clients.discard(ws)

    async def _notify_resync_webhook(self, visible_entries: list[dict[str, Any]]) -> None:
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout_s) as client:
                resp = await client.post(
                    self.config.resync_webhook_url,
                    json={"entries": visible_entries},
                    headers=headers,
                )
                resp.raise_for_status()
        except (httpx.TransportError, httpx.HTTPStatusError) as exc:
            # Non-fatal: the websocket push already happened for live clients.
            logger.warning("news_report: citizen portal resync webhook failed: %s", exc)


citizen_portal_feed = CitizenPortalFeed()
