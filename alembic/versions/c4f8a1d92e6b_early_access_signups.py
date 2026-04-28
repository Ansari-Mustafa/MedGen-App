"""early access signups

Revision ID: c4f8a1d92e6b
Revises: b2a1c4e9f73d
Create Date: 2026-04-28 18:00:00.000000

Adds:
- new table early_access_signups (public waitlist captured from the marketing site)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4f8a1d92e6b"
down_revision: Union[str, Sequence[str], None] = "b2a1c4e9f73d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "early_access_signups",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("practice", sa.String(length=300), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=True),
        sa.Column("reports_per_month", sa.String(length=20), nullable=True),
        sa.Column("pain_point", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_early_access_signups_email",
        "early_access_signups",
        ["email"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_early_access_signups_email", table_name="early_access_signups")
    op.drop_table("early_access_signups")
