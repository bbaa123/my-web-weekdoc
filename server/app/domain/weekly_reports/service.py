"""
WeeklyReport Service - 주간보고 비즈니스 로직
"""

from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.repositories.weekly_report_repository import WeeklyReportRepository
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    WeeklyReportCreate,
    WeeklyReportResponse,
    WeeklyReportUpdate,
)


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

    async def create_reports(
        self, current_login: Login, data_list: list[WeeklyReportCreate]
    ) -> list[WeeklyReportResponse]:
        """주간보고 일괄 등록 (로그인 사용자 ID 자동 매핑)"""
        results = []
        for data in data_list:
            report = await self.repo.create(current_login.id, data)
            results.append(WeeklyReportResponse.model_validate(report))
        await self.db.commit()
        return results

    async def update_report(
        self, no: int, current_login: Login, data: WeeklyReportUpdate
    ) -> WeeklyReportResponse:
        """주간보고 수정 (본인 또는 관리자만 가능)"""
        report = await self.repo.get_by_no(no)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not current_login.admin_yn and report.id != current_login.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        updated = await self.repo.update(report, data)
        await self.db.commit()
        return WeeklyReportResponse.model_validate(updated)

    async def delete_report(self, no: int, current_login: Login) -> None:
        """주간보고 삭제 (본인 또는 관리자만 가능)"""
        report = await self.repo.get_by_no(no)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not current_login.admin_yn and report.id != current_login.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        await self.repo.delete(report)
        await self.db.commit()
