"""add last_login_at and last_logout_at to login table

Revision ID: 20260402_0001
Revises: 20260329_0001
Create Date: 2026-04-02 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260402_0001"
down_revision: Union[str, None] = "20260329_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "login",
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "login",
        sa.Column("last_logout_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("login", "last_logout_at")
    op.drop_column("login", "last_login_at")
