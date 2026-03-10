"""create weekly_report_comments table

Revision ID: 20260310_0001
Revises: 20260309_0005
Create Date: 2026-03-10 00:00:00.000000

변경 사항:
- weekly_report_comments 테이블 생성
  - comment_id: SERIAL PRIMARY KEY (자동 채번)
  - weekly_reports_no: INTEGER NOT NULL, FK → weekly_reports(weekly_reports_no) ON DELETE CASCADE
  - id: VARCHAR(255) NOT NULL, FK → login(id)
  - content: TEXT NOT NULL
  - parent_comment_id: INTEGER, FK → weekly_report_comments(comment_id) (대댓글, NULL 허용)
  - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260310_0001"
down_revision: Union[str, None] = "20260309_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "weekly_report_comments",
        sa.Column("comment_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("weekly_reports_no", sa.Integer(), nullable=False),
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("parent_comment_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["weekly_reports_no"],
            ["weekly_reports.weekly_reports_no"],
            name="fk_report_no",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id"],
            ["login.id"],
            name="fk_commenter_id",
        ),
        sa.ForeignKeyConstraint(
            ["parent_comment_id"],
            ["weekly_report_comments.comment_id"],
            name="fk_parent_comment",
        ),
        sa.PrimaryKeyConstraint("comment_id"),
    )
    op.create_index(
        "ix_weekly_report_comments_weekly_reports_no",
        "weekly_report_comments",
        ["weekly_reports_no"],
    )
    op.create_index(
        "ix_weekly_report_comments_id",
        "weekly_report_comments",
        ["id"],
    )


def downgrade() -> None:
    op.drop_index("ix_weekly_report_comments_id", table_name="weekly_report_comments")
    op.drop_index(
        "ix_weekly_report_comments_weekly_reports_no", table_name="weekly_report_comments"
    )
    op.drop_table("weekly_report_comments")
