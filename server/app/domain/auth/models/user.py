"""
User 모델
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    admin_yn: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 전화번호
    job: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # 담당 업무
    nicname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # 닉네임
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 자기소개
    picture: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 사진 URL 또는 Base64 데이터
    created_at: Mapped[datetime] = mapped_column(
        DateTime(),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.now,
    )
