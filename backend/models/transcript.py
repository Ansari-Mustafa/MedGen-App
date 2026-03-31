import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recording_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("recordings.id"), nullable=False, unique=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # elevenlabs | deepgram | assemblyai
    raw_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    paragraphs_text: Mapped[str | None] = mapped_column(Text)
    utterances_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recording: Mapped["Recording"] = relationship("Recording", back_populates="transcript")
