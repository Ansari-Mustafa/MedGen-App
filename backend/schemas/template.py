import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from backend.schemas.common import OrmBase


class TemplateOut(OrmBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    name: str
    docx_storage_path: Optional[str] = None
    placeholders: dict = Field(default_factory=dict)
    doctor_profile: dict = Field(default_factory=dict)
    is_active: bool
    is_default: bool
    onboarding_status: str
    onboarding_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateOnboardResponse(BaseModel):
    template_id: uuid.UUID
    job_id: uuid.UUID
    status: str = "queued"


class OnboardingJobOut(OrmBase):
    id: uuid.UUID
    template_id: uuid.UUID
    status: str
    step: Optional[str] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime
