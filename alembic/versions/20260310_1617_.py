"""empty message

Revision ID: bbf50786bc9d
Revises: 20260309_0005
Create Date: 2026-03-10 16:17:15.528177

"""
from collections.abc import Sequence
from typing import Union

# revision identifiers, used by Alembic.
revision: str = 'bbf50786bc9d'
down_revision: Union[str, None] = '20260309_0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply migration changes to database."""
    pass


def downgrade() -> None:
    """Revert migration changes from database."""
    pass
