"""
WeeklyReport Service - 주간보고 비즈니스 로직
"""

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.models.weekly_report import WeeklyReport
from server.app.domain.weekly_reports.repositories.weekly_report_repository import WeeklyReportRepository
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import WeeklyReportCreate, WeeklyReportResponse


class WeeklyReportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = WeeklyReportRepository(db)

    async def list_reports(self, current_login: Login) -> list[WeeklyReportResponse]:
        """
        주간보고 목록 조회.
        - admin_yn=True: 전체 조회
        - admin_yn=False: 자신의 보고만 조회
        """
        if current_login.admin_yn:
            reports = await self.repo.list_all()
        else:
            reports = await self.repo.list_by_user(current_login.id)
        return [WeeklyReportResponse.model_validate(r) for r in reports]

    async def create_report(self, data: WeeklyReportCreate, current_login: Login) -> WeeklyReportResponse:
        """주간보고 등록"""
        report = WeeklyReport(
            id=current_login.id,
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
        created = await self.repo.create(report)
        return WeeklyReportResponse.model_validate(created)
