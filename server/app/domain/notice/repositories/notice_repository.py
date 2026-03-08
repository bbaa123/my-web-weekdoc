"""
Notice Repository - DB 접근 계층
"""

from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.notice.models.notice import Notice


class NoticeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_all(self) -> list[Notice]:
        """전체 공지사항 목록 (seq_no 순)"""
        result = await self.db.execute(select(Notice).order_by(Notice.seq_no.asc()))
        return list(result.scalars().all())

    async def list_active(self, today: date) -> list[Notice]:
        """유효한 공지사항 목록 (end_at >= today, seq_no 순)"""
        result = await self.db.execute(
            select(Notice)
            .where(Notice.end_at >= today)
            .order_by(Notice.seq_no.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, notice_id: int) -> Optional[Notice]:
        result = await self.db.execute(select(Notice).where(Notice.id == notice_id))
        return result.scalar_one_or_none()

    async def get_next_seq_no(self) -> int:
        """다음 seq_no 반환 (현재 최대값 + 1)"""
        result = await self.db.execute(select(func.max(Notice.seq_no)))
        max_seq = result.scalar_one_or_none()
        return (max_seq or 0) + 1

    async def create(self, notice: Notice) -> Notice:
        self.db.add(notice)
        await self.db.commit()
        await self.db.refresh(notice)
        return notice

    async def delete(self, notice: Notice) -> None:
        await self.db.delete(notice)
        await self.db.commit()
