"""
WeeklyReport 엔드포인트
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_login_user, get_database_session
from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    WeeklyReportCreate,
    WeeklyReportResponse,
    WeeklyReportUpdate,
)
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


@router.post(
    "",
    response_model=list[WeeklyReportResponse],
    status_code=201,
    summary="주간보고 일괄 등록",
)
async def create_reports(
    data_list: list[WeeklyReportCreate],
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[WeeklyReportResponse]:
    service = WeeklyReportService(db)
    return await service.create_reports(current_login, data_list)


@router.put(
    "/{no}",
    response_model=WeeklyReportResponse,
    summary="주간보고 수정 (본인 또는 관리자)",
)
async def update_report(
    no: int,
    data: WeeklyReportUpdate,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportResponse:
    service = WeeklyReportService(db)
    return await service.update_report(no, current_login, data)


@router.delete(
    "/{no}",
    status_code=204,
    summary="주간보고 삭제 (본인 또는 관리자)",
)
async def delete_report(
    no: int,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> None:
    service = WeeklyReportService(db)
    await service.delete_report(no, current_login)
