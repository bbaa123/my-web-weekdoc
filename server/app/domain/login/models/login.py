"""
Login 모델 - login 테이블
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from server.app.core.database import Base


class Login(Base):
    __tablename__ = "login"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # 로그인 아이디
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # 이름
    email: Mapped[str] = mapped_column(String(255), nullable=False)  # 이메일
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # 패스워드 해시
    admin_yn: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # 관리자 여부
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    last_logout_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
