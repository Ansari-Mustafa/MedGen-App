import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from backend.database import get_db
from backend.auth import require_staff
from backend.models.notification import Notification
from backend.schemas.notification import NotificationOut, MarkReadRequest

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == profile.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.post("/mark-read", status_code=204)
async def mark_read(
    body: MarkReadRequest,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.id.in_(body.ids), Notification.user_id == profile.id)
        .values(read=True)
    )
