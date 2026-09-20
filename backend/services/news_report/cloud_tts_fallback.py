"""
Thin client around Sarvam AI's Translate and Text-to-Speech APIs.

Kept in its own module (rather than inline in service.py) so it's easy
to mock in tests and easy to swap out later if the vendor changes.

Configuration (env vars):
    CLOUD_TTS_API_KEY     - required to actually call the cloud TTS API. If unset,
                             every call raises CloudTTSAPIError immediately
                             so callers can fall back gracefully instead
                             of hanging or crashing.
    SARVAM_API_BASE_URL   - defaults to https://api.sarvam.ai
    SARVAM_TIMEOUT_SECONDS - defaults to 15
    SARVAM_TTS_MODEL      - defaults to "bulbul:v3"
    SARVAM_TTS_SPEAKER    - defaults to "anand"

Note on TTS model: bulbul:v1 is deprecated by Sarvam and only ever had
solid coverage for Hindi/English. Full 11-language coverage (Bengali,
Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu,
plus Hindi/English) requires bulbul:v2 or bulbul:v3. v3 also has a
different (larger) speaker catalog than v1/v2, so the speaker name
must match the model - "meera" is not a valid v3 speaker.
"""
from __future__ import annotations

import base64
import os

import httpx

SARVAM_API_BASE_URL = os.environ.get("SARVAM_API_BASE_URL", "https://api.sarvam.ai").rstrip("/")
CLOUD_TTS_API_KEY = os.environ.get("CLOUD_TTS_API_KEY") or os.environ.get("SARVAM_API_KEY")
SARVAM_API_KEY = CLOUD_TTS_API_KEY
DEFAULT_TIMEOUT = float(os.environ.get("SARVAM_TIMEOUT_SECONDS", "15"))
DEFAULT_TTS_MODEL = os.environ.get("SARVAM_TTS_MODEL", "bulbul:v3")
DEFAULT_SPEAKER = os.environ.get("SARVAM_TTS_SPEAKER", "anand")

# Our short frontend-facing codes -> Sarvam's BCP-47-style codes.
# ("or" = Odia; Sarvam uses "od-IN" for Odia.)
LANGUAGE_CODE_MAP: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "or": "od-IN",
    "pa": "pa-IN",
    "ta": "ta-IN",
    "te": "te-IN",
}


class CloudTTSAPIError(RuntimeError):
    """Raised for any failure talking to the cloud TTS/translation provider - missing key, network
    error, bad status code, or an unexpected response shape. Callers are
    expected to catch this and fall back to the original text/no-audio
    rather than let it bubble up as a raw exception."""


SarvamAPIError = CloudTTSAPIError


def _require_api_key() -> str:
    key = os.environ.get("CLOUD_TTS_API_KEY") or os.environ.get("SARVAM_API_KEY") or CLOUD_TTS_API_KEY
    if not key:
        raise CloudTTSAPIError("CLOUD_TTS_API_KEY is not configured on the server")
    return key


def _headers() -> dict[str, str]:
    return {
        "API-Subscription-Key": _require_api_key(),
        "Content-Type": "application/json",
    }


def translate_text(text: str, target_language_code: str, source_language_code: str = "en-IN") -> str:
    """Translate a single piece of text via Sarvam's /translate endpoint.
    `target_language_code`/`source_language_code` are Sarvam codes
    (e.g. "hi-IN"), not our short "hi" codes - map before calling."""
    if not text or not text.strip():
        return text

    payload = {
        "input": text,
        "source_language_code": source_language_code,
        "target_language_code": target_language_code,
        "mode": "formal",
    }

    try:
        response = httpx.post(
            f"{SARVAM_API_BASE_URL}/translate",
            json=payload,
            headers=_headers(),
            timeout=DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise CloudTTSAPIError(f"Sarvam translate request failed: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise CloudTTSAPIError("Sarvam translate returned a non-JSON response") from exc

    translated = data.get("translated_text")
    if not translated:
        raise CloudTTSAPIError("Sarvam translate response was missing 'translated_text'")
    return translated


def synthesize_speech(text: str, target_language_code: str) -> bytes:
    """Synthesize speech via Sarvam's /text-to-speech endpoint and return
    raw audio bytes (WAV). `target_language_code` is a Sarvam code
    (e.g. "hi-IN"), not our short "hi" code - map before calling.

    Uses bulbul:v3, which is required for full 11-language coverage.
    bulbul:v1 (the old default here) is deprecated and never reliably
    supported anything beyond Hindi/English; bulbul:v3 also drops the
    pitch/loudness/enable_preprocessing knobs v1 exposed (preprocessing
    is automatic on v3), so those are not sent."""
    if not text or not text.strip():
        raise CloudTTSAPIError("Cannot synthesize speech for empty text")

    payload = {
        "text": text,
        "target_language_code": target_language_code,
        "speaker": DEFAULT_SPEAKER,
        "pace": 1.0,
        "speech_sample_rate": 22050,
        "model": DEFAULT_TTS_MODEL,
    }

    try:
        response = httpx.post(
            f"{SARVAM_API_BASE_URL}/text-to-speech",
            json=payload,
            headers=_headers(),
            timeout=DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise CloudTTSAPIError(f"Sarvam text-to-speech request failed: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise CloudTTSAPIError("Sarvam text-to-speech returned a non-JSON response") from exc

    audios = data.get("audios")
    if not audios:
        raise CloudTTSAPIError("Sarvam text-to-speech response was missing 'audios'")

    try:
        return base64.b64decode(audios[0])
    except (ValueError, TypeError) as exc:
        raise CloudTTSAPIError("Sarvam text-to-speech returned invalid base64 audio") from exc
