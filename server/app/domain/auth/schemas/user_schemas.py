"""
Auth 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    """사용자 응답"""

    id: str
    name: str
    department: Optional[str]
    email: str
    admin_yn: bool
    position: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    """사용자 로그인 요청"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """토큰 응답"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserCreate(BaseModel):
    """사용자 생성 요청"""

    id: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    email: EmailStr
    admin_yn: bool = Field(default=False)
    position: Optional[str] = Field(default=None, max_length=100)


class UserUpsertRequest(BaseModel):
    """사용자 프로필 Upsert 요청"""

    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    department: Optional[str] = Field(default=None, max_length=100)
    position: Optional[str] = Field(default=None, max_length=100)
    admin_yn: bool = Field(default=False)


class UserProfileResponse(BaseModel):
    """사용자 프로필 응답 (users 테이블 없을 경우 login 기본값 포함)"""

    id: str
    name: str
    email: str
    department: Optional[str] = None
    position: Optional[str] = None
    admin_yn: bool = False
    exists_in_users: bool = False  # users 테이블에 레코드가 있는지 여부
