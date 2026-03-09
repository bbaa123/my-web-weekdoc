"""
WeeklyReport 엔드포인트
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_login_user, get_database_session
from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import WeeklyReportResponse
from server.app.domain.weekly_reports.service import WeeklyReportService

router = APIRouter(prefix="/weekly-reports", tags=["weekly-reports"])


@router.get(
    "",
    response_model=list[WeeklyReportResponse],
    summary="주간보고 목록 조회 (admin: 전체, 일반: 본인 것만)",
)
async def list_reports(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[WeeklyReportResponse]:
    service = WeeklyReportService(db)
    return await service.list_reports(current_login)
