"""create departments table

Revision ID: 20260310_0002
Revises: 20260310_0001
Create Date: 2026-03-10 00:00:00.000000

변경 사항:
- departments 테이블 생성
  - dept_code: VARCHAR(20) PRIMARY KEY - 부서 코드
  - dept_name: VARCHAR(100) NOT NULL - 부서명
  - parent_dept_code: VARCHAR(20), FK → departments(dept_code) (Self-Join, NULL 허용)
  - use_yn: CHAR(1) DEFAULT 'Y' - 사용 유무 ('Y' 또는 'N'만 허용)
  - dept_level: INTEGER - 조직 계층 레벨 (NULL 허용)
  - sort_order: INTEGER DEFAULT 0 - 출력 순서
  - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260310_0002"
down_revision: Union[str, None] = "20260310_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("dept_code", sa.String(length=20), nullable=False),
        sa.Column("dept_name", sa.String(length=100), nullable=False),
        sa.Column("parent_dept_code", sa.String(length=20), nullable=True),
        sa.Column("use_yn", sa.CHAR(length=1), nullable=False, server_default="Y"),
        sa.Column("dept_level", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.CheckConstraint("use_yn IN ('Y', 'N')", name="chk_use_yn"),
        sa.ForeignKeyConstraint(
            ["parent_dept_code"],
            ["departments.dept_code"],
            name="fk_parent_dept",
        ),
        sa.PrimaryKeyConstraint("dept_code"),
    )


def downgrade() -> None:
    op.drop_table("departments")
