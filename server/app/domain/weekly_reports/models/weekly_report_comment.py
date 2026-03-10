"""
WeeklyReportComment 모델 - weekly_report_comments 테이블
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class WeeklyReportComment(Base):
    __tablename__ = "weekly_report_comments"

    comment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    weekly_reports_no: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("weekly_reports.weekly_reports_no", name="fk_report_no", ondelete="CASCADE"),
        nullable=False,
    )
    id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("login.id", name="fk_commenter_id"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_comment_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("weekly_report_comments.comment_id", name="fk_parent_comment"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.now,
    )
