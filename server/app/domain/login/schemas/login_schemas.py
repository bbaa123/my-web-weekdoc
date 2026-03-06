"""
Login 도메인 스키마
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


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
