"""
WeeklyReport Repository - DB 접근 계층
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.weekly_reports.models.weekly_report import WeeklyReport


class WeeklyReportRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_all(self) -> list[WeeklyReport]:
        """전체 주간보고 목록 (submitted_at 내림차순)"""
        result = await self.db.execute(
            select(WeeklyReport).order_by(WeeklyReport.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_user(self, login_id: str) -> list[WeeklyReport]:
        """특정 사용자의 주간보고 목록 (submitted_at 내림차순)"""
        result = await self.db.execute(
            select(WeeklyReport)
            .where(WeeklyReport.id == login_id)
            .order_by(WeeklyReport.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, report: WeeklyReport) -> WeeklyReport:
        """주간보고 등록"""
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report
