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
