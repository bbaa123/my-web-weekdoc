"""
WeeklyReport Service - 주간보고 비즈니스 로직
"""

from typing import Optional

from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.department.repositories.department_repository import DepartmentRepository
from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.ai_service import WeeklyReportAIService
from server.app.domain.weekly_reports.repositories.weekly_report_repository import WeeklyReportRepository
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    AISummarizeResponse,
    AIGuideResponse,
    TeamWeeklyReportResponse,
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

    async def _get_accessible_dept_codes(self, login_id: str, is_admin: bool) -> list[str] | None:
        """
        사용자가 접근 가능한 부서 코드 목록 반환.
        - admin 또는 최상위 부서장: None (전체 접근)
        - 일반 사용자: 본인 부서 + 직속 하위 부서 코드 목록
        """
        if is_admin:
            return None

        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(login_id)
        if not user or not user.department:
            return None

        dept_repo = DepartmentRepository(self.db)
        dept = await dept_repo.get_by_code(user.department)
        if not dept or not dept.parent_dept_code:
            # 최상위 부서이면 전체 접근
            return None

        children = await dept_repo.list_by_parent_code(user.department)
        return [user.department] + [c.dept_code for c in children]

    async def ai_summarize(self, no: int, current_login: Login) -> AISummarizeResponse:
        """
        주간보고 this_week 내용을 AI로 한 문장 요약하고 DB에 저장.
        - 본인 보고서 또는 admin만 가능
        """
        report = await self.repo.get_by_no(no)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not current_login.admin_yn and report.id != current_login.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        if not report.this_week:
            raise HTTPException(status_code=400, detail="요약할 금주 진행 사항이 없습니다.")

        ai_svc = WeeklyReportAIService()
        summary_text = ai_svc.summarize(report.this_week)

        update_data = WeeklyReportUpdate(summary=summary_text)
        await self.repo.update(report, update_data)
        await self.db.commit()

        return AISummarizeResponse(summary=summary_text, weekly_reports_no=no)

    async def ai_guide(self, no: int, current_login: Login) -> AIGuideResponse:
        """
        주간보고 this_week 내용의 미흡한 점을 AI로 분석하여 피드백 반환 (저장 없음).
        - 본인 보고서 또는 admin만 가능
        """
        report = await self.repo.get_by_no(no)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not current_login.admin_yn and report.id != current_login.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        if not report.this_week:
            raise HTTPException(status_code=400, detail="분석할 금주 진행 사항이 없습니다.")

        ai_svc = WeeklyReportAIService()
        guide_text = ai_svc.guide(report.this_week)

        return AIGuideResponse(guide=guide_text)

    async def list_team_reports(
        self, current_login: Login, department: Optional[str] = None
    ) -> list[TeamWeeklyReportResponse]:
        """
        팀 주간보고 목록 조회 (모든 사용자 부서 선택 가능, 계층 권한 적용).
        - department 지정: 해당 부서 보고서 조회 (접근 가능 범위 내)
        - department 미지정:
          - admin / 최상위 부서장: 전체 보고서
          - 일반 사용자: 접근 가능한 부서의 보고서 전체
        """
        accessible = await self._get_accessible_dept_codes(current_login.id, current_login.admin_yn)

        if department:
            # 접근 가능 범위 검증 (accessible=None이면 전체 허용)
            if accessible is not None and department not in accessible:
                raise HTTPException(status_code=403, detail="해당 부서에 대한 접근 권한이 없습니다.")
            rows = await self.repo.list_with_author_by_department(department)
        else:
            if accessible is None:
                rows = await self.repo.list_all_with_author()
            else:
                rows = await self.repo.list_with_author_by_departments(accessible)

        results = []
        for report, author_name, dept in rows:
            report_data = WeeklyReportResponse.model_validate(report).model_dump()
            report_data["author_name"] = author_name or report.id
            report_data["department"] = dept
            results.append(TeamWeeklyReportResponse(**report_data))
        return results
