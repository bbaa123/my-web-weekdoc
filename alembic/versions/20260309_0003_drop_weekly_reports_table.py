"""drop weekly_reports table

Revision ID: 20260309_0003
Revises: 20260309_0002
Create Date: 2026-03-09 00:00:00.000000

변경 사항:
- weekly_reports 테이블 삭제
  - users 테이블과의 FK 제약 조건 (weekly_reports_author_id_fkey) 제거
  - ix_weekly_reports_author_id 인덱스 제거
  - weekly_reports 테이블 DROP
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260309_0003"
down_revision: Union[str, None] = "20260309_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. weekly_reports → users FK 제약 조건 제거
    # ------------------------------------------------------------------ #
    op.drop_constraint("weekly_reports_author_id_fkey", "weekly_reports", type_="foreignkey")

    # ------------------------------------------------------------------ #
    # 2. 인덱스 제거
    # ------------------------------------------------------------------ #
    op.drop_index("ix_weekly_reports_author_id", table_name="weekly_reports")

    # ------------------------------------------------------------------ #
    # 3. weekly_reports 테이블 삭제
    # ------------------------------------------------------------------ #
    op.drop_table("weekly_reports")


def downgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. weekly_reports 테이블 재생성
    # ------------------------------------------------------------------ #
    op.create_table(
        "weekly_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("author_id", sa.String(length=255), nullable=False),
        sa.Column("author_name", sa.String(length=100), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("work_type", sa.String(length=50), nullable=False),
        sa.Column("project_name", sa.String(length=200), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("priority", sa.String(length=10), nullable=False),
        sa.Column("issues", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'작성 중'")),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("feedback_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
            name="weekly_reports_author_id_fkey",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # ------------------------------------------------------------------ #
    # 2. 인덱스 재생성
    # ------------------------------------------------------------------ #
    op.create_index("ix_weekly_reports_author_id", "weekly_reports", ["author_id"])
