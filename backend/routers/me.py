"""
/me  — current user profile
/profiles/setup — called after Supabase signup to create the profile row
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.database import get_db
from backend.auth import get_current_user, bearer_scheme, _decode_token
from backend.models.profile import Profile
from backend.schemas.common import OrmBase

router = APIRouter(tags=["me"])


class ProfileOut(OrmBase):
    id: uuid.UUID
    role: str
    full_name: str
    email: str
    phone: Optional[str]
    avatar_url: Optional[str]
    clinic_id: Optional[uuid.UUID]
    doctor_id: Optional[uuid.UUID]
    expo_push_token: Optional[str]


class ProfileSetupRequest(BaseModel):
    full_name: str
    role: str = "doctor"          # doctor | secretary
    doctor_id: Optional[uuid.UUID] = None   # required if role == secretary
    phone: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    expo_push_token: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/me", response_model=ProfileOut)
async def get_me(profile=Depends(get_current_user)):
    return profile


@router.patch("/me", response_model=ProfileOut)
async def update_me(
    body: ProfileUpdateRequest,
    profile=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    result = await db.execute(
        __import__("sqlalchemy", fromlist=["select"]).select(Profile).where(Profile.id == profile.id)
    )
    p = result.scalar_one()
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(p, field, val)
    return p


@router.post("/profiles/setup", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
async def setup_profile(
    body: ProfileSetupRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    credentials=Depends(bearer_scheme),
):
    """
    Called by the mobile app immediately after Supabase signup.
    Creates the profile row linked to the Supabase auth user.
    Idempotent — returns existing profile if already set up.
    """
    from sqlalchemy import select
    try:
        payload = _decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    email = payload.get("email", "")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Idempotent — return existing if already created
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    if body.role == "secretary" and not body.doctor_id:
        raise HTTPException(status_code=422, detail="doctor_id is required for secretary role")

    profile = Profile(
        id=uuid.UUID(user_id),
        role=body.role,
        full_name=body.full_name,
        email=email,
        phone=body.phone,
        doctor_id=body.doctor_id,
    )
    db.add(profile)
    await db.flush()
    await db.commit()
    return profile
