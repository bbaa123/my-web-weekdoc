"""
Login 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, computed_field


class LoginCreate(BaseModel):
    """회원가입 요청"""

    id: str = Field(..., min_length=1, max_length=100, description="로그인 아이디")
    name: str = Field(..., min_length=1, max_length=100, description="이름")
    email: EmailStr = Field(..., description="이메일")
    password: str = Field(..., min_length=4, description="패스워드")
    admin_yn: bool = Field(default=False, description="관리자 여부")


class LoginRequest(BaseModel):
    """로그인 요청"""

    id: str = Field(..., description="로그인 아이디")
    password: str = Field(..., description="패스워드")


class LoginUserResponse(BaseModel):
    """로그인 사용자 응답"""

    id: str
    name: str
    email: str
    admin_yn: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginTokenResponse(BaseModel):
    """JWT 토큰 응답"""

    access_token: str
    token_type: str = "bearer"
    user: LoginUserResponse


class ChangePasswordRequest(BaseModel):
    """비밀번호 변경 요청"""

    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(..., min_length=4, description="새 비밀번호")
    confirm_new_password: str = Field(..., description="새 비밀번호 확인")


class PresenceUserResponse(BaseModel):
    """접속자 현황용 사용자 응답"""

    id: str
    name: str
    email: str
    department: Optional[str] = None
    position: Optional[str] = None
    nicname: Optional[str] = None
    picture: Optional[str] = None
    last_login_at: Optional[datetime] = None
    last_logout_at: Optional[datetime] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_online(self) -> bool:
        """last_login_at > last_logout_at 이면 온라인"""
        if self.last_login_at is None:
            return False
        if self.last_logout_at is None:
            return True
        return self.last_login_at > self.last_logout_at

    model_config = {"from_attributes": True}
