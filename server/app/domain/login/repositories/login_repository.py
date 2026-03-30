"""
Login Repository - DB 접근 계층
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.login.models.login import Login


class LoginRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, login_id: str) -> Optional[Login]:
        result = await self.db.execute(select(Login).where(Login.id == login_id))
        return result.scalar_one_or_none()

    async def create(self, login: Login) -> Login:
        self.db.add(login)
        await self.db.commit()
        await self.db.refresh(login)
        return login

    async def list_all(self) -> list[Login]:
        result = await self.db.execute(select(Login).order_by(Login.name))
        return list(result.scalars().all())

    async def update_admin_yn(self, login_id: str, admin_yn: bool) -> None:
        login = await self.get_by_id(login_id)
        if login:
            login.admin_yn = admin_yn
            await self.db.commit()

    async def update_password(self, login_id: str, new_password: str) -> None:
        login = await self.get_by_id(login_id)
        if login:
            login.password_hash = new_password
            await self.db.commit()
