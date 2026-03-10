"""
Department 모델 - 부서 관리
"""

from datetime import datetime

from sqlalchemy import CHAR, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    __table_args__ = (
        CheckConstraint("use_yn IN ('Y', 'N')", name="chk_use_yn"),
    )

    dept_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    dept_name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_dept_code: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("departments.dept_code", name="fk_parent_dept"),
        nullable=True,
    )
    use_yn: Mapped[str] = mapped_column(CHAR(1), nullable=False, default="Y", server_default="Y")
    dept_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default="CURRENT_TIMESTAMP",
    )
