import uuid
from datetime import datetime
from pydantic import BaseModel
from backend.schemas.common import OrmBase


class NotificationOut(OrmBase):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str
    data: dict
    read: bool
    created_at: datetime


class MarkReadRequest(BaseModel):
    ids: list[uuid.UUID]
