"""
WeeklyReport Service - 주간보고서 비즈니스 로직
"""

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.auth.models.user import User
from server.app.domain.weeklyreport.models.weekly_report import WeeklyReport
from server.app.domain.weeklyreport.repositories.report_repository import WeeklyReportRepository
from server.app.domain.weeklyreport.schemas.report_schemas import (
    WeeklyReportCreate,
    WeeklyReportResponse,
    WeeklyReportUpdate,
)


def _get_week_start(d: date) -> date:
    """주어진 날짜의 해당 주 월요일 반환"""
    return d - __import__("datetime").timedelta(days=d.weekday())


class WeeklyReportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = WeeklyReportRepository(db)

    async def list_reports(
        self,
        current_user: User,
        year: Optional[int] = None,
        month: Optional[int] = None,
        week_number: Optional[int] = None,
        member_id: Optional[int] = None,
    ) -> list[WeeklyReportResponse]:
        """
        보고서 목록 조회.
        - 일반 사용자: 본인 보고서만
        - 관리자: member_id로 특정 멤버 보고서 조회 가능
        """
        target_author_id = None
        if current_user.is_admin and member_id is not None:
            target_author_id = member_id

        reports = await self.repo.list_by_author(
            author_id=current_user.id,
            year=year,
            month=month,
            week_number=week_number,
            target_author_id=target_author_id,
        )
        return [WeeklyReportResponse.model_validate(r) for r in reports]

    async def create_report(
        self, current_user: User, data: WeeklyReportCreate
    ) -> WeeklyReportResponse:
        today = date.today()
        week_start = data.week_start or _get_week_start(today)

        report = WeeklyReport(
            author_id=current_user.id,
            author_name=current_user.name,
            week_start=week_start,
            year=week_start.year,
            month=week_start.month,
            week_number=week_start.isocalendar()[1],
            work_type=data.work_type,
            project_name=data.project_name,
            summary=data.summary,
            progress=data.progress,
            priority=data.priority,
            issues=data.issues,
            status="제출 완료",
            submitted_at=datetime.now(timezone.utc),
        )
        report = await self.repo.create(report)
        return WeeklyReportResponse.model_validate(report)

    async def update_report(
        self, current_user: User, report_id: int, data: WeeklyReportUpdate
    ) -> WeeklyReportResponse:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("보고서를 찾을 수 없습니다.")
        if report.author_id != current_user.id and not current_user.is_admin:
            raise PermissionError("수정 권한이 없습니다.")

        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(report, field, value)
        report.updated_at = datetime.now(timezone.utc)

        report = await self.repo.update(report)
        return WeeklyReportResponse.model_validate(report)

    async def submit_report(self, current_user: User, report_id: int) -> WeeklyReportResponse:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("보고서를 찾을 수 없습니다.")
        if report.author_id != current_user.id:
            raise PermissionError("제출 권한이 없습니다.")

        report.status = "제출 완료"
        report.submitted_at = datetime.now(timezone.utc)
        report.updated_at = datetime.now(timezone.utc)
        report = await self.repo.update(report)
        return WeeklyReportResponse.model_validate(report)

    async def add_feedback(
        self, current_user: User, report_id: int, comment: Optional[str]
    ) -> WeeklyReportResponse:
        if not current_user.is_admin:
            raise PermissionError("피드백 권한이 없습니다.")
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("보고서를 찾을 수 없습니다.")

        report.feedback = comment
        report.feedback_at = datetime.now(timezone.utc)
        report.status = "피드백 도착"
        report.updated_at = datetime.now(timezone.utc)
        report = await self.repo.update(report)
        return WeeklyReportResponse.model_validate(report)
