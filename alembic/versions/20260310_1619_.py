"""empty message

Revision ID: 93a0f6aa94d0
Revises: bbf50786bc9d
Create Date: 2026-03-10 16:19:32.427442

"""
from collections.abc import Sequence
from typing import Union

# revision identifiers, used by Alembic.
revision: str = '93a0f6aa94d0'
down_revision: Union[str, None] = 'bbf50786bc9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply migration changes to database."""
    pass


def downgrade() -> None:
    """Revert migration changes from database."""
    pass
