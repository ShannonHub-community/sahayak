"""
Centralised configuration for the news_report service.

Everything is read from environment variables so the module behaves the same
way in dev / staging / prod without code changes. Sensible defaults are only
provided for non-secret, non-destructive values (timeouts, retry counts).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str | None = None, required: bool = False) -> str:
    val = os.getenv(name, default)
    if required and not val:
        raise RuntimeError(
            f"[news_report.config] Missing required environment variable: {name}"
        )
    return val or ""


@dataclass(frozen=True)
class AIModelConfig:
    # Shared AI model API - same backend used by the AI Decision System.
    base_url: str = field(default_factory=lambda: _env("AI_MODEL_API_URL", required=True))
    api_key: str = field(default_factory=lambda: _env("AI_MODEL_API_KEY", required=True))
    model: str = field(default_factory=lambda: _env("AI_MODEL_NAME", "claude-sonnet-4-6"))
    timeout_s: float = field(default_factory=lambda: float(_env("AI_MODEL_TIMEOUT_S", "30")))
    max_retries: int = field(default_factory=lambda: int(_env("AI_MODEL_MAX_RETRIES", "3")))


@dataclass(frozen=True)
class SMSGatewayConfig:
    base_url: str = field(default_factory=lambda: _env("SMS_GATEWAY_URL", required=True))
    api_key: str = field(default_factory=lambda: _env("SMS_GATEWAY_API_KEY", required=True))
    timeout_s: float = field(default_factory=lambda: float(_env("SMS_GATEWAY_TIMEOUT_S", "15")))
    max_retries: int = field(default_factory=lambda: int(_env("SMS_GATEWAY_MAX_RETRIES", "3")))


@dataclass(frozen=True)
class PressPortalConfig:
    base_url: str = field(default_factory=lambda: _env("PRESS_PORTAL_URL", required=True))
    api_key: str = field(default_factory=lambda: _env("PRESS_PORTAL_API_KEY", required=True))
    timeout_s: float = field(default_factory=lambda: float(_env("PRESS_PORTAL_TIMEOUT_S", "20")))
    max_retries: int = field(default_factory=lambda: int(_env("PRESS_PORTAL_MAX_RETRIES", "3")))


@dataclass(frozen=True)
class DigitalTwinConfig:
    base_url: str = field(default_factory=lambda: _env("DIGITAL_TWIN_API_URL", required=True))
    api_key: str = field(default_factory=lambda: _env("DIGITAL_TWIN_API_KEY", ""))
    timeout_s: float = field(default_factory=lambda: float(_env("DIGITAL_TWIN_TIMEOUT_S", "15")))


@dataclass(frozen=True)
class AuditTrailConfig:
    # REST base for pulling historical logs (press releases, "last N hours").
    base_url: str = field(default_factory=lambda: _env("AUDIT_TRAIL_API_URL", required=True))
    api_key: str = field(default_factory=lambda: _env("AUDIT_TRAIL_API_KEY", ""))
    timeout_s: float = field(default_factory=lambda: float(_env("AUDIT_TRAIL_TIMEOUT_S", "15")))
    # Pub/sub channel that Twin Aggregator + audit trail writers publish to.
    # (Redis is assumed; swap the subscriber in timeline.py if the platform
    # actually uses Kafka / SNS / etc - the rest of the pipeline is agnostic.)
    event_bus_url: str = field(default_factory=lambda: _env("EVENT_BUS_URL", required=True))
    event_channel: str = field(
        default_factory=lambda: _env("AUDIT_TRAIL_EVENT_CHANNEL", "audit_trail.events")
    )


@dataclass(frozen=True)
class CitizenPortalConfig:
    # Used to push a "resync" webhook in addition to the in-process websocket
    # fan-out, so the Citizen Portal's New Report tab stays correct even if a
    # client missed the live websocket push.
    resync_webhook_url: str = field(default_factory=lambda: _env("CITIZEN_PORTAL_RESYNC_URL", ""))
    api_key: str = field(default_factory=lambda: _env("CITIZEN_PORTAL_API_KEY", ""))
    timeout_s: float = field(default_factory=lambda: float(_env("CITIZEN_PORTAL_TIMEOUT_S", "10")))


@dataclass(frozen=True)
class DBConfig:
    url: str = field(default_factory=lambda: _env("DATABASE_URL", required=True))


ai_model_config = AIModelConfig() if os.getenv("AI_MODEL_API_URL") else None
sms_gateway_config = SMSGatewayConfig() if os.getenv("SMS_GATEWAY_URL") else None
press_portal_config = PressPortalConfig() if os.getenv("PRESS_PORTAL_URL") else None
digital_twin_config = DigitalTwinConfig() if os.getenv("DIGITAL_TWIN_API_URL") else None
audit_trail_config = AuditTrailConfig() if os.getenv("AUDIT_TRAIL_API_URL") else None
citizen_portal_config = CitizenPortalConfig()

# NOTE: the module-level singletons above are lazily-None at import time if
# the corresponding env vars aren't set yet (e.g. during unit tests that
# monkeypatch clients). Each client class also accepts an explicit config
# object so tests can inject fakes without touching the environment.
