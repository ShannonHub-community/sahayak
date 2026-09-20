"""
Photo storage for PDNA reports.

Production target is a Supabase Storage bucket named `damage-photos`
(per the architecture doc). This module wraps that behind a small
interface so the rest of the service just calls `upload_photo(...)`
and gets back a URL/path -- it doesn't need to know whether that came
from Supabase or local disk.

Local disk is the default so the service runs with zero external
credentials. Set SUPABASE_URL + SUPABASE_SERVICE_KEY to switch to real
Supabase Storage (requires `pip install supabase`).
"""
import os
import uuid
from pathlib import Path
from typing import Optional

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_PHOTO_BYTES = 15 * 1024 * 1024  # 15 MB

_LOCAL_STORAGE_ROOT = Path(
    os.environ.get(
        "PDNA_LOCAL_STORAGE_ROOT",
        Path(__file__).resolve().parents[3] / "storage" / "damage-photos",
    )
)


class PhotoValidationError(ValueError):
    pass


class StorageBackend:
    def upload(self, filename: str, content: bytes, content_type: Optional[str]) -> str:
        raise NotImplementedError


class LocalDiskStorage(StorageBackend):
    """Dev/default backend: writes into storage/damage-photos/ on disk."""

    def __init__(self, root: Path = _LOCAL_STORAGE_ROOT):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def upload(self, filename: str, content: bytes, content_type: Optional[str]) -> str:
        ext = Path(filename).suffix or ".jpg"
        key = f"{uuid.uuid4().hex}{ext}"
        dest = self.root / key
        dest.write_bytes(content)
        # Mirrors the Supabase Storage "path within bucket" convention referenced
        # in the DB schema notes (photo_url = Supabase Storage path).
        return f"damage-photos/{key}"


class SupabaseStorage(StorageBackend):
    """Production backend: uploads to a real Supabase Storage bucket."""

    def __init__(self):
        try:
            from supabase import create_client  # type: ignore
        except ImportError as e:
            raise RuntimeError(
                "SUPABASE_URL/SUPABASE_SERVICE_KEY are set but the `supabase` "
                "package isn't installed. Run `pip install supabase`."
            ) from e

        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        self.bucket = os.environ.get("SUPABASE_BUCKET", "damage-photos")
        self.client = create_client(url, key)

    def upload(self, filename: str, content: bytes, content_type: Optional[str]) -> str:
        ext = Path(filename).suffix or ".jpg"
        key = f"{uuid.uuid4().hex}{ext}"
        self.client.storage.from_(self.bucket).upload(
            key, content, {"content-type": content_type or "image/jpeg"}
        )
        return f"{self.bucket}/{key}"


def get_storage_backend() -> StorageBackend:
    if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"):
        return SupabaseStorage()
    return LocalDiskStorage()


def validate_photo(filename: str, content: bytes, content_type: Optional[str]) -> None:
    if not content:
        raise PhotoValidationError("Photo file is empty.")
    if len(content) > MAX_PHOTO_BYTES:
        raise PhotoValidationError(
            f"Photo exceeds max size of {MAX_PHOTO_BYTES // (1024 * 1024)} MB."
        )
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise PhotoValidationError(
            f"Unsupported content type '{content_type}'. Allowed: {sorted(ALLOWED_CONTENT_TYPES)}"
        )


def upload_photo(filename: str, content: bytes, content_type: Optional[str]) -> str:
    validate_photo(filename, content, content_type)
    backend = get_storage_backend()
    return backend.upload(filename, content, content_type)
