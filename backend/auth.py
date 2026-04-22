"""
Supabase JWT verification using the JWKS endpoint (RS256/ES256).
Falls back to HS256 shared secret for older Supabase projects.
JWKS keys are cached in-process and refreshed every hour.
"""
import time
import uuid
import jwt
from jwt import PyJWKClient

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.config import get_settings
from backend.database import get_db

settings = get_settings()
bearer_scheme = HTTPBearer()

_jwks_client: PyJWKClient | None = None
_jwks_last_fetch: float = 0
_JWKS_TTL = 3600  # refresh public keys every hour


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_last_fetch
    now = time.monotonic()
    if _jwks_client is None or (now - _jwks_last_fetch) > _JWKS_TTL:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        _jwks_last_fetch = now
    return _jwks_client


def _decode_token(token: str) -> dict:
    """Try JWKS (RS256/ES256) first; fall back to HS256 shared secret."""
    if settings.supabase_url:
        try:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                options={"verify_aud": False},
            )
        except Exception:
            pass  # fall through to HS256 for older projects

    if settings.supabase_jwt_secret:
        secret = settings.supabase_jwt_secret.strip('"')
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

    raise jwt.InvalidTokenError("No JWT verification method configured")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Verify Supabase JWT and return the Profile ORM row.

    If the Supabase user exists but no Profile row is present (e.g. user was
    created via the Supabase dashboard, or /profiles/setup was never called),
    auto-provision one from the JWT claims. This prevents stale auth states
    where the mobile client has a valid session but the backend 404s on /me.
    """
    try:
        payload = _decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Lazy import to avoid circular dependency
    from backend.models.profile import Profile

    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None:
        email = payload.get("email", "") or ""
        meta = payload.get("user_metadata") or {}
        full_name = meta.get("full_name") or (email.split("@")[0] if email else "New User")
        role = meta.get("role") or "doctor"

        profile = Profile(
            id=uuid.UUID(user_id),
            role=role,
            full_name=full_name,
            email=email,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


async def require_doctor(profile=Depends(get_current_user)):
    """Only doctors can call this endpoint."""
    if profile.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    return profile


async def require_staff(profile=Depends(get_current_user)):
    """Doctors or secretaries can call this endpoint."""
    if profile.role not in ("doctor", "secretary"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    return profile


def get_doctor_id(profile) -> str:
    """Return the owning doctor_id regardless of whether caller is doctor or secretary."""
    if profile.role == "doctor":
        return str(profile.id)
    return str(profile.doctor_id)
