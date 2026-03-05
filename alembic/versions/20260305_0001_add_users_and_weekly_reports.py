"""add users and weekly reports

Revision ID: 20260305_0001
Revises:
Create Date: 2026-03-05 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260305_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users 테이블 생성
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("department", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=100), nullable=False),
        sa.Column("position", sa.String(length=50), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # weekly_reports 테이블 생성
    op.create_table(
        "weekly_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("author_name", sa.String(length=100), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("work_type", sa.String(length=50), nullable=False),
        sa.Column("project_name", sa.String(length=200), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("priority", sa.String(length=10), nullable=False),
        sa.Column("issues", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="작성 중"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("feedback_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_weekly_reports_author_id", "weekly_reports", ["author_id"])


def downgrade() -> None:
    op.drop_index("ix_weekly_reports_author_id", table_name="weekly_reports")
    op.drop_table("weekly_reports")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
