import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class EarlyAccessSignup(Base):
    """Public early-access waitlist captured from the marketing landing page."""

    __tablename__ = "early_access_signups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    practice: Mapped[str | None] = mapped_column(String(300))
    role: Mapped[str | None] = mapped_column(String(50))           # medical_legal_expert | instructing_solicitor | agency | other
    reports_per_month: Mapped[str | None] = mapped_column(String(20))  # "1-10" | "11-30" | "31-60" | "60+"
    pain_point: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | approved | rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
