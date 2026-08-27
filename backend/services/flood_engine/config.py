"""
Central configuration for the Sahayak backend.

All external service locations and tunable parameters live here so the
SOS service (and any future service) can import one settings object instead
of scattering os.environ calls everywhere.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Supabase / Postgres ---
    supabase_url: str = "https://YOUR-PROJECT.supabase.co"
    supabase_key: str = "YOUR-SUPABASE-SERVICE-ROLE-OR-ANON-KEY"

    # --- External services (mocked / stubbed for demo, see clients) ---
    flood_engine_url: str = "http://localhost:9001"          # drift-correction offset
    twin_aggregator_url: str = "http://localhost:9002"       # digital twin state feed

    # --- SOS dedup tuning ---
    dedup_window_minutes: int = 30        # debounce time window
    dedup_gps_range_meters: float = 100.0  # acceptable GPS range for "same report"

    # --- SMS gateway (simulated) ---
    sms_shared_secret: str = "demo-sms-secret"  # simple shared-secret check for the mock webhook

    # --- Flood Prediction Engine: ingestion sources ---
    open_meteo_base_url: str = "https://api.open-meteo.com/v1/forecast"
    cwc_base_url: str = "https://cwc-mock.local/api"          # CWC public portal / GRRR, mocked for demo
    dem_file_path: str = "services/flood_engine/data/dem_values.json"
    ingestion_source_timeout_seconds: float = 5.0

    # --- Flood Prediction Engine: feature engineering ---
    rainfall_accumulation_window_hours: int = 24

    # --- Flood Prediction Engine: scoring ---
    flood_model_path: str = "services/flood_engine/data/flood_model.json"
    flood_model_version: str = "v1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
