"""add user profile fields (tel, job, nicname, remark, picture)

Revision ID: a1b2c3d4e5f6
Revises: 93a0f6aa94d0
Create Date: 2026-03-11 00:00:00.000000

변경 사항:
- users 테이블에 신규 컬럼 추가
  - tel: 전화번호 VARCHAR(50) nullable
  - job: 담당 업무 VARCHAR(500) nullable
  - nicname: 닉네임 VARCHAR(100) nullable
  - remark: 자기소개 TEXT nullable
  - picture: 사진 URL VARCHAR(1000) nullable
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "93a0f6aa94d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tel, job, nicname, remark, picture columns to users table."""
    op.add_column("users", sa.Column("tel", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("job", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("nicname", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("remark", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("picture", sa.String(1000), nullable=True))


def downgrade() -> None:
    """Remove tel, job, nicname, remark, picture columns from users table."""
    op.drop_column("users", "picture")
    op.drop_column("users", "remark")
    op.drop_column("users", "nicname")
    op.drop_column("users", "job")
    op.drop_column("users", "tel")
