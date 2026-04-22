import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from backend.schemas.common import OrmBase


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    scheduled_at: Optional[datetime] = None
    type: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None


class AppointmentOut(OrmBase):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    patient_name: Optional[str] = None
    scheduled_at: Optional[datetime]
    status: str
    type: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
