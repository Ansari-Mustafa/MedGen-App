import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)  # matches auth.users.id
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'doctor' | 'secretary'
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str | None] = mapped_column(String(50))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    clinic_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clinics.id"))
    doctor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"))  # for secretaries
    expo_push_token: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="members", foreign_keys=[clinic_id])
    patients: Mapped[list["Patient"]] = relationship("Patient", back_populates="doctor", foreign_keys="Patient.doctor_id")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="doctor")
    templates: Mapped[list["Template"]] = relationship("Template", back_populates="doctor")
    secretaries: Mapped[list["Profile"]] = relationship("Profile", foreign_keys=[doctor_id])
