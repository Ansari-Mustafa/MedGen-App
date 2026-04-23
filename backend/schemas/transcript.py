import uuid
from datetime import datetime
from typing import Optional

from backend.schemas.common import OrmBase


class TranscriptListItem(OrmBase):
    id: uuid.UUID
    recording_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    patient_name: Optional[str] = None
    appointment_scheduled_at: Optional[datetime] = None
    provider: str
    duration_s: Optional[int] = None
    snippet: Optional[str] = None
    created_at: datetime


class TranscriptOut(OrmBase):
    id: uuid.UUID
    recording_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    patient_name: Optional[str] = None
    appointment_scheduled_at: Optional[datetime] = None
    provider: str
    paragraphs_text: Optional[str] = None
    utterances_text: Optional[str] = None
    duration_s: Optional[int] = None
    audio_url: Optional[str] = None
    created_at: datetime
