"""
database/supabase_client.py — shared Supabase client for the Sahayak backend.

Was missing entirely, which is why every route that imported it
(`from database.supabase_client import get_supabase`) failed at import
time before the app could even start. One cached client is reused across
requests rather than reconnecting per call.
"""
from functools import lru_cache

from supabase import create_client, Client

from config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)
