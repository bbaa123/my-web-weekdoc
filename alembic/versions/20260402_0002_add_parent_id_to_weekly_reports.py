"""add parent_id to weekly_reports (self-referencing)

Revision ID: 20260402_0002
Revises: 20260402_0001
Create Date: 2026-04-02 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260402_0002"
down_revision: Union[str, None] = "20260402_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "weekly_reports",
        sa.Column("parent_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_weekly_reports_parent_id",
        "weekly_reports",
        "weekly_reports",
        ["parent_id"],
        ["weekly_reports_no"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_weekly_reports_parent_id", "weekly_reports", type_="foreignkey")
    op.drop_column("weekly_reports", "parent_id")
