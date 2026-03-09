"""create weekly_reports table

Revision ID: 20260309_0005
Revises: 20260309_0004
Create Date: 2026-03-09 00:00:00.000000

변경 사항:
- weekly_reports 테이블 생성
  - weekly_reports_no: SERIAL PRIMARY KEY (자동 채번)
  - id: VARCHAR(255) NOT NULL, FK → login(id)
  - year: VARCHAR(4), CHECK IN ('2026'~'2030')
  - month: VARCHAR(2), CHECK IN ('01'~'12')
  - week_number: VARCHAR(10), CHECK IN ('1주차'~'5주차')
  - company: VARCHAR(100)
  - work_type: VARCHAR(50)
  - project_name: VARCHAR(255)
  - this_week: TEXT
  - next_week: TEXT
  - progress: INTEGER DEFAULT 0, CHECK 0~100
  - priority: VARCHAR(20)
  - issues: TEXT
  - status: VARCHAR(20)
  - submitted_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - feedback: VARCHAR(255)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260309_0005"
down_revision: Union[str, None] = "20260309_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "weekly_reports",
        sa.Column("weekly_reports_no", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("year", sa.String(length=4), nullable=False),
        sa.Column("month", sa.String(length=2), nullable=False),
        sa.Column("week_number", sa.String(length=10), nullable=False),
        sa.Column("company", sa.String(length=100), nullable=True),
        sa.Column("work_type", sa.String(length=50), nullable=True),
        sa.Column("project_name", sa.String(length=255), nullable=True),
        sa.Column("this_week", sa.Text(), nullable=True),
        sa.Column("next_week", sa.Text(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("priority", sa.String(length=20), nullable=True),
        sa.Column("issues", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column(
            "submitted_at",
            sa.DateTime(),
            nullable=True,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("feedback", sa.String(length=255), nullable=True),
        sa.CheckConstraint(
            "week_number IN ('1주차', '2주차', '3주차', '4주차', '5주차')",
            name="ck_weekly_reports_week_number",
        ),
        sa.CheckConstraint(
            "year IN ('2026', '2027', '2028', '2029', '2030')",
            name="ck_weekly_reports_year",
        ),
        sa.CheckConstraint(
            "month IN ('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12')",
            name="ck_weekly_reports_month",
        ),
        sa.CheckConstraint(
            "progress >= 0 AND progress <= 100",
            name="ck_weekly_reports_progress",
        ),
        sa.ForeignKeyConstraint(["id"], ["login.id"], name="fk_weekly_reports_login_id"),
        sa.PrimaryKeyConstraint("weekly_reports_no"),
    )
    op.create_index("ix_weekly_reports_id", "weekly_reports", ["id"])


def downgrade() -> None:
    op.drop_index("ix_weekly_reports_id", table_name="weekly_reports")
    op.drop_table("weekly_reports")
