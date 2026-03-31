"""Templates router — stub for Phase 1. Full onboarding pipeline in Phase 3."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.auth import require_doctor, get_doctor_id
from backend.models.template import Template
from backend.schemas.common import OrmBase

router = APIRouter(prefix="/templates", tags=["templates"])


class TemplateOut(OrmBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    name: str
    placeholders: dict
    is_active: bool


@router.get("", response_model=list[TemplateOut])
async def list_templates(
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Template).where(Template.doctor_id == doctor_id).order_by(Template.name)
    )
    return result.scalars().all()


@router.post("/onboard", status_code=202)
async def start_onboarding(
    profile=Depends(require_doctor),
):
    """Upload past reports and start template onboarding job. Implemented in Phase 3."""
    return {"message": "Onboarding pipeline coming in Phase 3"}
