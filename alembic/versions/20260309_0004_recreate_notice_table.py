"""recreate notice table

Revision ID: 20260309_0004
Revises: 20260309_0003
Create Date: 2026-03-09 00:00:00.000000

변경 사항:
- notice 테이블 재생성
  - 기존 notice 테이블 DROP
  - 새 스키마로 notice 테이블 재생성:
    - notice_id: SERIAL PRIMARY KEY
    - id: VARCHAR(255) NOT NULL, FK to login(id)
    - content: TEXT NOT NULL
    - start_at: TIMESTAMP (nullable)
    - end_at: TIMESTAMP (nullable)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260309_0004"
down_revision: Union[str, None] = "20260309_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 기존 notice 테이블 삭제
    op.drop_table("notice")

    # 새 스키마로 notice 테이블 생성
    op.create_table(
        "notice",
        sa.Column("notice_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("start_at", sa.DateTime(), nullable=True),
        sa.Column("end_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["id"], ["login.id"], name="fk_login_id"),
        sa.PrimaryKeyConstraint("notice_id"),
    )
    op.create_index("ix_notice_id", "notice", ["id"])


def downgrade() -> None:
    op.drop_index("ix_notice_id", table_name="notice")
    op.drop_table("notice")

    # 이전 notice 테이블 복원
    op.create_table(
        "notice",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("author_name", sa.String(length=100), nullable=False),
        sa.Column("seq_no", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("start_at", sa.Date(), nullable=False),
        sa.Column("end_at", sa.Date(), nullable=False),
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
    op.create_index("ix_notice_author_id", "notice", ["author_id"])
    op.create_index("ix_notice_end_at", "notice", ["end_at"])
