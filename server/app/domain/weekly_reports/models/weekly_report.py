"""
WeeklyReport 모델 - weekly_reports 테이블
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    __table_args__ = (
        CheckConstraint(
            "week_number IN ('1주차', '2주차', '3주차', '4주차', '5주차')",
            name="ck_weekly_reports_week_number",
        ),
        CheckConstraint(
            "year IN ('2026', '2027', '2028', '2029', '2030')",
            name="ck_weekly_reports_year",
        ),
        CheckConstraint(
            "month IN ('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12')",
            name="ck_weekly_reports_month",
        ),
        CheckConstraint(
            "progress >= 0 AND progress <= 100",
            name="ck_weekly_reports_progress",
        ),
    )

    weekly_reports_no: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("login.id", name="fk_weekly_reports_login_id"),
        nullable=False,
    )
    year: Mapped[str] = mapped_column(String(4), nullable=False)
    month: Mapped[str] = mapped_column(String(2), nullable=False)
    week_number: Mapped[str] = mapped_column(String(10), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    this_week: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_week: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    issues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    feedback: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
