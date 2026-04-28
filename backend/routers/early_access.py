"""
Public early-access waitlist endpoint.

POST /early-access — accepts a signup payload from the marketing site and
stores it in the early_access_signups table. No auth. Rate-limited per IP
to prevent abuse.
"""
import time
from collections import deque
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.early_access import EarlyAccessSignup

router = APIRouter(tags=["early-access"])

# ---------------------------------------------------------------------
# Rate limiting — simple in-memory sliding window per IP.
# Good enough for a single-process dev/staging deploy. For production
# behind multiple workers, swap for Redis-backed (slowapi / aiolimiter).
# ---------------------------------------------------------------------
_RATE_WINDOW_SEC = 3600          # 1 hour window
_RATE_MAX_HITS = 5               # max submissions per IP per window
_hits: dict[str, deque[float]] = {}


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    window_start = now - _RATE_WINDOW_SEC
    bucket = _hits.setdefault(ip, deque(maxlen=_RATE_MAX_HITS * 2))
    # Drop stale hits
    while bucket and bucket[0] < window_start:
        bucket.popleft()
    if len(bucket) >= _RATE_MAX_HITS:
        retry_in = int(bucket[0] + _RATE_WINDOW_SEC - now)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Try again in {max(retry_in, 60)} seconds.",
            headers={"Retry-After": str(max(retry_in, 60))},
        )
    bucket.append(now)


# ---------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------
class EarlyAccessRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    practice: Optional[str] = Field(default=None, max_length=300)
    role: Optional[str] = Field(default=None, max_length=50)
    reports_per_month: Optional[str] = Field(default=None, max_length=20)
    pain_point: Optional[str] = Field(default=None, max_length=2000)

    # Enriched by the Next.js proxy — accepted but optional.
    ip: Optional[str] = Field(default=None, max_length=64)
    user_agent: Optional[str] = Field(default=None, max_length=500)


class EarlyAccessResponse(BaseModel):
    ok: bool
    message: str


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------
def _client_ip(request: Request, override: str | None) -> str:
    if override:
        return override
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post(
    "/early-access",
    response_model=EarlyAccessResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_early_access(
    body: EarlyAccessRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _client_ip(request, body.ip)
    _check_rate_limit(ip)

    email = body.email.lower().strip()

    # Idempotent — if email already exists, return success without creating
    # a duplicate row. Don't reveal whether the email is in the system to
    # casual probing; just confirm receipt.
    existing = await db.execute(
        select(EarlyAccessSignup).where(EarlyAccessSignup.email == email)
    )
    if existing.scalar_one_or_none():
        return EarlyAccessResponse(
            ok=True,
            message="You're already on the list. We'll be in touch.",
        )

    signup = EarlyAccessSignup(
        name=body.name.strip(),
        email=email,
        practice=(body.practice or "").strip() or None,
        role=body.role or None,
        reports_per_month=body.reports_per_month or None,
        pain_point=(body.pain_point or "").strip() or None,
        ip_address=ip,
        user_agent=body.user_agent,
        status="pending",
    )
    db.add(signup)

    try:
        await db.flush()
    except IntegrityError:
        # Race against the existence check above — treat as success.
        await db.rollback()
        return EarlyAccessResponse(
            ok=True,
            message="You're already on the list. We'll be in touch.",
        )

    return EarlyAccessResponse(
        ok=True,
        message="Thanks. We'll reply within a week.",
    )
