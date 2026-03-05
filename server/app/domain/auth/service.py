"""
Auth Service - 인증 비즈니스 로직
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.config import settings
from server.app.domain.auth.models.user import User
from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.auth.schemas.user_schemas import TokenResponse, UserCreate, UserResponse

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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

    async def register(self, data: UserCreate) -> TokenResponse:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ValueError("이미 사용 중인 이메일입니다.")

        user = User(
            name=data.name,
            department=data.department,
            email=data.email,
            role=data.role,
            position=data.position,
            is_admin=data.is_admin,
            hashed_password=hash_password(data.password),
        )
        user = await self.repo.create(user)

        token = create_access_token({"sub": str(user.id), "email": user.email})
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("이메일 또는 비밀번호가 올바르지 않습니다.")
        if not user.is_active:
            raise ValueError("비활성화된 계정입니다.")

        token = create_access_token({"sub": str(user.id), "email": user.email})
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    async def get_current_user(self, token: str) -> Optional[User]:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return await self.repo.get_by_id(int(user_id))
