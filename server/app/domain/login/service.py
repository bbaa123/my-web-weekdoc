"""
Login Service - 로그인 비즈니스 로직
"""

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.auth.service import create_access_token
from server.app.domain.login.models.login import Login
from server.app.domain.login.repositories.login_repository import LoginRepository
from server.app.domain.login.schemas.login_schemas import ChangePasswordRequest, LoginCreate, LoginTokenResponse, LoginUserResponse


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
            password_hash=data.password,
            admin_yn=False,
        )
        login = await self.repo.create(login)

        token = create_access_token({"sub": login.id, "type": "login"})
        return LoginTokenResponse(
            access_token=token,
            user=LoginUserResponse.model_validate(login),
        )

    async def login(self, login_id: str, password: str) -> LoginTokenResponse:
        login = await self.repo.get_by_id(login_id)
        if not login or login.password_hash != password:
            raise ValueError("아이디 또는 비밀번호가 올바르지 않습니다.")

        token = create_access_token({"sub": login.id, "type": "login"})
        return LoginTokenResponse(
            access_token=token,
            user=LoginUserResponse.model_validate(login),
        )

    async def change_password(self, login_id: str, data: ChangePasswordRequest) -> None:
        if data.new_password != data.confirm_new_password:
            raise ValueError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.")

        login = await self.repo.get_by_id(login_id)
        if not login or login.password_hash != data.current_password:
            raise ValueError("현재 비밀번호가 올바르지 않습니다.")

        await self.repo.update_password(login_id, data.new_password)
