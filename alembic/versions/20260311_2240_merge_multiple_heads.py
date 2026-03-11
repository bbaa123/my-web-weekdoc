"""Merge multiple heads

Revision ID: a8e372a5c23b
Revises: 20260310_0002, 20260311_0001, b2c3d4e5f6a7
Create Date: 2026-03-11 22:40:25.487410

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8e372a5c23b'
down_revision: Union[str, None] = ('20260310_0002', '20260311_0001', 'b2c3d4e5f6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply migration changes to database."""
    pass


def downgrade() -> None:
    """Revert migration changes from database."""
    pass
