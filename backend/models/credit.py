import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, unique=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    plan_type: Mapped[str] = mapped_column(String(50), default="free")  # free | starter | pro
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    transactions: Mapped[list["CreditTransaction"]] = relationship("CreditTransaction", back_populates="account")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("credit_accounts.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # positive = credit, negative = debit
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # purchase | usage
    ref: Mapped[str | None] = mapped_column(String(255))  # stripe payment intent id, report id, etc.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    account: Mapped["CreditAccount"] = relationship("CreditAccount", back_populates="transactions")
