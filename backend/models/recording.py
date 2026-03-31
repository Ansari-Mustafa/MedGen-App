import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    storage_path: Mapped[str | None] = mapped_column(String(500))
    duration_s: Mapped[int | None] = mapped_column(Integer)
    file_size: Mapped[int | None] = mapped_column(Integer)  # bytes
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending | uploaded | processing | done | error
    source: Mapped[str] = mapped_column(String(20), default="app_recorded")  # app_recorded | uploaded
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="recordings")
    transcript: Mapped["Transcript | None"] = relationship("Transcript", back_populates="recording", uselist=False)
