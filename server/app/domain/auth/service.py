"""
Auth Service - 사용자 조회 비즈니스 로직
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.config import settings
from server.app.domain.auth.models.user import User
from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.auth.schemas.user_schemas import UserCreate, UserResponse

ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    async def create_user(self, data: UserCreate) -> UserResponse:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ValueError("이미 사용 중인 이메일입니다.")

        user = User(
            id=data.id,
            name=data.name,
            department=data.department,
            email=data.email,
            admin_yn=data.admin_yn,
            position=data.position,
        )
        user = await self.repo.create(user)
        return UserResponse.model_validate(user)

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        user = await self.repo.get_by_id(user_id)
        if not user:
            return None
        return UserResponse.model_validate(user)

    async def get_current_user(self, token: str) -> Optional[User]:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return await self.repo.get_by_id(user_id)

    async def list_users(self) -> list[UserResponse]:
        users = await self.repo.list_all()
        return [UserResponse.model_validate(u) for u in users]
