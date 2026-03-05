"""
WeeklyReport 엔드포인트
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_user, get_database_session
from server.app.domain.auth.models.user import User
from server.app.domain.weeklyreport.schemas.report_schemas import (
    WeeklyReportCreate,
    WeeklyReportResponse,
    WeeklyReportUpdate,
)
from server.app.domain.weeklyreport.service import WeeklyReportService

router = APIRouter(prefix="/weekly-reports", tags=["weekly-reports"])


@router.get(
    "",
    response_model=list[WeeklyReportResponse],
    summary="주간보고서 목록 조회",
)
async def list_reports(
    year: Optional[int] = None,
    month: Optional[int] = None,
    week_number: Optional[int] = None,
    member_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[WeeklyReportResponse]:
    service = WeeklyReportService(db)
    return await service.list_reports(
        current_user=current_user,
        year=year,
        month=month,
        week_number=week_number,
        member_id=member_id,
    )


@router.post(
    "",
    response_model=WeeklyReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="주간보고서 생성",
)
async def create_report(
    data: WeeklyReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportResponse:
    service = WeeklyReportService(db)
    return await service.create_report(current_user, data)


@router.patch(
    "/{report_id}",
    response_model=WeeklyReportResponse,
    summary="주간보고서 수정",
)
async def update_report(
    report_id: int,
    data: WeeklyReportUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportResponse:
    service = WeeklyReportService(db)
    try:
        return await service.update_report(current_user, report_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post(
    "/{report_id}/submit",
    response_model=WeeklyReportResponse,
    summary="주간보고서 제출",
)
async def submit_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportResponse:
    service = WeeklyReportService(db)
    try:
        return await service.submit_report(current_user, report_id)
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{report_id}/feedback",
    response_model=WeeklyReportResponse,
    summary="피드백 등록 (관리자)",
)
async def add_feedback(
    report_id: int,
    comment: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportResponse:
    service = WeeklyReportService(db)
    try:
        return await service.add_feedback(current_user, report_id, comment)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
