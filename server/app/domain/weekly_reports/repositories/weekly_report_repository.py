"""
WeeklyReport Repository - DB 접근 계층
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_

from server.app.domain.weekly_reports.models.weekly_report import WeeklyReport
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    WeeklyReportCreate,
    WeeklyReportUpdate,
)


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

    async def get_by_no(self, no: int) -> WeeklyReport | None:
        """PK로 단건 조회"""
        result = await self.db.execute(
            select(WeeklyReport).where(WeeklyReport.weekly_reports_no == no)
        )
        return result.scalar_one_or_none()

    async def create(self, login_id: str, data: WeeklyReportCreate) -> WeeklyReport:
        """주간보고 등록"""
        report = WeeklyReport(
            id=login_id,
            year=data.year,
            month=data.month,
            week_number=data.week_number,
            company=data.company,
            work_type=data.work_type,
            project_name=data.project_name,
            this_week=data.this_week,
            next_week=data.next_week,
            progress=data.progress,
            priority=data.priority,
            issues=data.issues,
            status=data.status,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def update(self, report: WeeklyReport, data: WeeklyReportUpdate) -> WeeklyReport:
        """주간보고 수정"""
        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(report, key, value)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def list_with_author_by_department(self, department: str) -> list:
        """부서별 주간보고 목록 (작성자 이름·부서 포함, submitted_at 내림차순)"""
        from server.app.domain.auth.models.user import User

        result = await self.db.execute(
            select(WeeklyReport, User.name, User.department)
            .outerjoin(User, WeeklyReport.id == User.id)
            .where(User.department == department)
            .order_by(WeeklyReport.submitted_at.desc())
        )
        return list(result.all())

    async def list_with_author_by_departments(self, departments: list[str]) -> list:
        """여러 부서의 주간보고 목록 (작성자 이름·부서 포함, submitted_at 내림차순)"""
        from server.app.domain.auth.models.user import User

        result = await self.db.execute(
            select(WeeklyReport, User.name, User.department)
            .outerjoin(User, WeeklyReport.id == User.id)
            .where(or_(*[User.department == dept for dept in departments]))
            .order_by(WeeklyReport.submitted_at.desc())
        )
        return list(result.all())

    async def list_all_with_author(self) -> list:
        """전체 주간보고 목록 (작성자 이름·부서 포함, admin용, submitted_at 내림차순)"""
        from server.app.domain.auth.models.user import User

        result = await self.db.execute(
            select(WeeklyReport, User.name, User.department)
            .outerjoin(User, WeeklyReport.id == User.id)
            .order_by(WeeklyReport.submitted_at.desc())
        )
        return list(result.all())

    async def delete(self, report: WeeklyReport) -> None:
        """주간보고 삭제"""
        await self.db.delete(report)
        await self.db.flush()
