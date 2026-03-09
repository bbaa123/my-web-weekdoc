"""
Notice 모델
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class Notice(Base):
    __tablename__ = "notice"

    notice_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(
        String(255), ForeignKey("login.id"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
