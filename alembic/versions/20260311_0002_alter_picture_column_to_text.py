"""alter picture column to TEXT for base64 image storage

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-11 00:01:00.000000

변경 사항:
- users 테이블의 picture 컬럼을 VARCHAR(1000) → TEXT 로 변경
  Base64 인코딩된 이미지 데이터를 저장할 수 있도록 크기 제한 제거
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Alter picture column from VARCHAR(1000) to TEXT."""
    op.alter_column(
        "users",
        "picture",
        existing_type=sa.String(1000),
        type_=sa.Text(),
        existing_nullable=True,
        nullable=True,
    )


def downgrade() -> None:
    """Revert picture column from TEXT to VARCHAR(1000)."""
    op.alter_column(
        "users",
        "picture",
        existing_type=sa.Text(),
        type_=sa.String(1000),
        existing_nullable=True,
        nullable=True,
    )
