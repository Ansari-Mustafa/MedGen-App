import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from backend.schemas.common import OrmBase


class RecordingOut(OrmBase):
    id: uuid.UUID
    appointment_id: uuid.UUID
    storage_path: Optional[str]
    duration_s: Optional[int]
    file_size: Optional[int]
    status: str
    source: str
    created_at: datetime


class RecordingUploadMeta(BaseModel):
    appointment_id: uuid.UUID
    template_id: uuid.UUID
    duration_s: Optional[int] = None
    source: str = "app_recorded"  # app_recorded | uploaded
