"""
Login Service - 로그인 비즈니스 로직
"""

from datetime import timedelta

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.auth.service import create_access_token
from server.app.domain.login.models.login import Login
from server.app.domain.login.repositories.login_repository import LoginRepository
from server.app.domain.login.schemas.login_schemas import LoginCreate, LoginTokenResponse, LoginUserResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


class LoginService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = LoginRepository(db)

    async def register(self, data: LoginCreate) -> LoginTokenResponse:
        existing = await self.repo.get_by_id(data.id)
        if existing:
            raise ValueError("이미 사용 중인 아이디입니다.")

        login = Login(
            id=data.id,
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            admin_yn=data.admin_yn,
        )
        login = await self.repo.create(login)

        token = create_access_token({"sub": login.id, "type": "login"})
        return LoginTokenResponse(
            access_token=token,
            user=LoginUserResponse.model_validate(login),
        )

    async def login(self, login_id: str, password: str) -> LoginTokenResponse:
        login = await self.repo.get_by_id(login_id)
        if not login or not verify_password(password, login.password_hash):
            raise ValueError("아이디 또는 비밀번호가 올바르지 않습니다.")

        token = create_access_token({"sub": login.id, "type": "login"})
        return LoginTokenResponse(
            access_token=token,
            user=LoginUserResponse.model_validate(login),
        )
