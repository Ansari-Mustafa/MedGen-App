"""templates onboarding

Revision ID: b2a1c4e9f73d
Revises: 8606e815d758
Create Date: 2026-04-23 12:00:00.000000

Adds:
- templates.is_default, source_report_paths, onboarding_status, onboarding_error
- partial unique index uq_templates_doctor_default on (doctor_id) WHERE is_default
- new table template_onboarding_jobs
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b2a1c4e9f73d"
down_revision: Union[str, Sequence[str], None] = "8606e815d758"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "templates",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "templates",
        sa.Column(
            "source_report_paths",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.add_column(
        "templates",
        sa.Column(
            "onboarding_status",
            sa.String(length=30),
            nullable=False,
            server_default="ready",
        ),
    )
    op.add_column("templates", sa.Column("onboarding_error", sa.Text(), nullable=True))

    op.create_index(
        "uq_templates_doctor_default",
        "templates",
        ["doctor_id"],
        unique=True,
        postgresql_where=sa.text("is_default = true"),
    )

    op.create_table(
        "template_onboarding_jobs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("doctor_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("step", sa.String(length=30), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "source_report_paths",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["template_id"], ["templates.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["doctor_id"], ["profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_template_onboarding_jobs_doctor_id",
        "template_onboarding_jobs",
        ["doctor_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_template_onboarding_jobs_doctor_id", table_name="template_onboarding_jobs"
    )
    op.drop_table("template_onboarding_jobs")
    op.drop_index("uq_templates_doctor_default", table_name="templates")
    op.drop_column("templates", "onboarding_error")
    op.drop_column("templates", "onboarding_status")
    op.drop_column("templates", "source_report_paths")
    op.drop_column("templates", "is_default")
