"""
Notice Repository - DB 접근 계층
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.notice.models.notice import Notice


class NoticeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_all(self) -> list[Notice]:
        """전체 공지사항 목록 (notice_id 순)"""
        result = await self.db.execute(select(Notice).order_by(Notice.notice_id.asc()))
        return list(result.scalars().all())

    async def list_active(self, now: datetime) -> list[Notice]:
        """유효한 공지사항 목록 (start_at <= now <= end_at, notice_id 순)"""
        result = await self.db.execute(
            select(Notice)
            .where(
                or_(Notice.start_at.is_(None), Notice.start_at <= now),
                or_(Notice.end_at.is_(None), Notice.end_at >= now),
            )
            .order_by(Notice.notice_id.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, notice_id: int) -> Optional[Notice]:
        result = await self.db.execute(select(Notice).where(Notice.notice_id == notice_id))
        return result.scalar_one_or_none()

    async def create(self, notice: Notice) -> Notice:
        self.db.add(notice)
        await self.db.commit()
        await self.db.refresh(notice)
        return notice

    async def delete(self, notice: Notice) -> None:
        await self.db.delete(notice)
        await self.db.commit()
