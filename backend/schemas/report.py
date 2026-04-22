import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any
from backend.schemas.common import OrmBase


class ReportOut(OrmBase):
    id: uuid.UUID
    appointment_id: uuid.UUID
    template_id: uuid.UUID
    patient_name: Optional[str] = None
    filled_json: dict
    docx_path: Optional[str]
    pdf_path: Optional[str]
    status: str
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ReportUpdate(BaseModel):
    filled_json: Optional[dict] = None


class ReportEditSave(BaseModel):
    fields: dict[str, Any]  # field_name -> new value (string or list)
