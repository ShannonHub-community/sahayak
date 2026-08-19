from supabase import Client, create_client

from shared.config import get_settings


settings = get_settings()


def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        raise RuntimeError(
            "Supabase configuration is missing. "
            "Set SUPABASE_URL and SUPABASE_KEY in the environment."
        )

    return create_client(
        settings.supabase_url,
        settings.supabase_key,
    )