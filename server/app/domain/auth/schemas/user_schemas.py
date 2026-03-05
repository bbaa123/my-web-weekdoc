"""
Auth 도메인 스키마
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """회원가입 요청"""

    name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(..., min_length=1, max_length=100, description="담당업무")
    position: Literal["매니저", "팀장", "센터장"] = Field(..., description="직책")
    is_admin: bool = Field(default=False)
    password: str = Field(..., min_length=4)


class UserLogin(BaseModel):
    """로그인 요청"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """사용자 응답"""

    id: int
    name: str
    department: str
    email: str
    role: str
    position: str
    is_admin: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT 토큰 응답"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
