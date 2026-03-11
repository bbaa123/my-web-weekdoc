"""
User Repository - DB 접근 계층
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.auth.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[User]:
        result = await self.db.execute(select(User).order_by(User.name))
        return list(result.scalars().all())

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def upsert(
        self,
        user_id: str,
        name: str,
        email: str,
        department: Optional[str] = None,
        position: Optional[str] = None,
        admin_yn: bool = False,
        tel: Optional[str] = None,
        job: Optional[str] = None,
        nicname: Optional[str] = None,
        remark: Optional[str] = None,
        picture: Optional[str] = None,
    ) -> User:
        existing = await self.get_by_id(user_id)
        if existing:
            existing.name = name
            existing.email = email
            existing.department = department
            existing.position = position
            existing.admin_yn = admin_yn
            existing.tel = tel
            existing.job = job
            existing.nicname = nicname
            existing.remark = remark
            existing.picture = picture
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            user = User(
                id=user_id,
                name=name,
                email=email,
                department=department,
                position=position,
                admin_yn=admin_yn,
                tel=tel,
                job=job,
                nicname=nicname,
                remark=remark,
                picture=picture,
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            return user
