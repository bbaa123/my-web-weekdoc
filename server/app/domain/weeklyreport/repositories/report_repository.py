"""
WeeklyReport Repository - DB 접근 계층
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.weeklyreport.models.weekly_report import WeeklyReport


class WeeklyReportRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_author(
        self,
        author_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        week_number: Optional[int] = None,
        target_author_id: Optional[int] = None,
    ) -> list[WeeklyReport]:
        """
        현재 사용자의 보고서 목록 조회 (필터 적용 가능)
        관리자는 target_author_id로 특정 멤버 조회 가능
        """
        query = select(WeeklyReport).where(WeeklyReport.author_id == author_id)

        if target_author_id is not None:
            query = select(WeeklyReport).where(WeeklyReport.author_id == target_author_id)

        if year is not None:
            query = query.where(WeeklyReport.year == year)
        if month is not None:
            query = query.where(WeeklyReport.month == month)
        if week_number is not None:
            query = query.where(WeeklyReport.week_number == week_number)

        query = query.order_by(WeeklyReport.week_start.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, report_id: int) -> Optional[WeeklyReport]:
        result = await self.db.execute(
            select(WeeklyReport).where(WeeklyReport.id == report_id)
        )
        return result.scalar_one_or_none()

    async def create(self, report: WeeklyReport) -> WeeklyReport:
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def update(self, report: WeeklyReport) -> WeeklyReport:
        await self.db.commit()
        await self.db.refresh(report)
        return report
