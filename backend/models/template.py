import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    docx_storage_path: Mapped[str | None] = mapped_column(String(500))
    placeholders: Mapped[dict] = mapped_column(JSONB, default=dict)  # {name: {type, description}}
    doctor_profile: Mapped[dict] = mapped_column(JSONB, default=dict)  # writing style, phrases, terminology
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor: Mapped["Profile"] = relationship("Profile", back_populates="templates")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="template")
