"""
Supabase Storage operations.
Buckets: audio, reports, templates
"""
import asyncio
from pathlib import Path
from backend.database import get_supabase

BUCKET_AUDIO = "audio"
BUCKET_REPORTS = "reports"
BUCKET_TEMPLATES = "templates"


def _client():
    return get_supabase()


async def upload_bytes(bucket: str, path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to a bucket. Returns the storage path."""
    def _upload():
        _client().storage.from_(bucket).upload(
            path=path,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return path

    return await asyncio.to_thread(_upload)


async def upload_file(bucket: str, path: str, local_path: str) -> str:
    """Upload a local file to a bucket. Returns the storage path."""
    data = Path(local_path).read_bytes()
    ext = Path(local_path).suffix.lower()
    content_types = {
        ".mp3": "audio/mpeg", ".mp4": "audio/mp4", ".wav": "audio/wav",
        ".m4a": "audio/m4a", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pdf": "application/pdf",
    }
    ct = content_types.get(ext, "application/octet-stream")
    return await upload_bytes(bucket, path, data, ct)


async def download_bytes(bucket: str, path: str) -> bytes:
    """Download a file from a bucket. Returns raw bytes."""
    def _download():
        return _client().storage.from_(bucket).download(path)

    return await asyncio.to_thread(_download)


async def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """Return a signed URL valid for `expires_in` seconds."""
    def _sign():
        res = _client().storage.from_(bucket).create_signed_url(path, expires_in)
        return res["signedURL"]

    return await asyncio.to_thread(_sign)


async def delete_file(bucket: str, path: str):
    def _delete():
        _client().storage.from_(bucket).remove([path])

    await asyncio.to_thread(_delete)
