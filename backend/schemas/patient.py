import uuid
from datetime import datetime, date
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.schemas.common import OrmBase


class PatientCreate(BaseModel):
    full_name: str
    dob: Optional[date] = None
    address: Optional[str] = None
    nino: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    nino: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None


class PatientOut(OrmBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    full_name: str
    dob: Optional[date]
    address: Optional[str]
    nino: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
