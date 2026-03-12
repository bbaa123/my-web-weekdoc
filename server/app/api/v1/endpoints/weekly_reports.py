"""
WeeklyReport 엔드포인트
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_login_user, get_database_session
from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.comment_service import WeeklyReportCommentService
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    AICenterBriefingRequest,
    AICenterBriefingResponse,
    AISummarizeResponse,
    AIGuideResponse,
    AIGuideRequest,
    SendReportEmailRequest,
    SendReportEmailResponse,
    TeamWeeklyReportResponse,
    WeeklyReportCommentCreate,
    WeeklyReportCommentResponse,
    WeeklyReportCommentUpdate,
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


@router.get(
    "/team",
    response_model=list[TeamWeeklyReportResponse],
    summary="팀 주간보고 목록 (admin: 전체 또는 특정 부서, 일반: 본인 부서)",
)
async def list_team_reports(
    department: Optional[str] = Query(default=None, description="부서 필터 (admin 전용)"),
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[TeamWeeklyReportResponse]:
    service = WeeklyReportService(db)
    return await service.list_team_reports(current_login, department)


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


# ─── AI 엔드포인트 ────────────────────────────────────────────────────────────


@router.post(
    "/{no}/ai/summarize",
    response_model=AISummarizeResponse,
    summary="AI 요약: this_week 내용을 한 문장으로 요약하고 summary 컬럼에 저장",
)
async def ai_summarize(
    no: int,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> AISummarizeResponse:
    service = WeeklyReportService(db)
    return await service.ai_summarize(no, current_login)


@router.post(
    "/{no}/ai/guide",
    response_model=AIGuideResponse,
    summary="AI 가이드: this_week 내용의 미흡한 점 분석 피드백 반환 (저장된 보고서 기반)",
)
async def ai_guide(
    no: int,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> AIGuideResponse:
    service = WeeklyReportService(db)
    return await service.ai_guide(no, current_login)


@router.post(
    "/ai/center-briefing",
    response_model=AICenterBriefingResponse,
    summary="AI 센터 종합 브리핑: 조회 조건에 해당하는 전체 보고서를 분석하여 센터장용 브리핑 생성",
)
async def ai_center_briefing(
    data: AICenterBriefingRequest,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> AICenterBriefingResponse:
    service = WeeklyReportService(db)
    return await service.ai_center_briefing(
        current_login,
        data.year,
        data.month,
        data.week_number,
        data.department,
    )


@router.post(
    "/ai/guide-text",
    response_model=AIGuideResponse,
    summary="AI 가이드: 텍스트 직접 전달하여 보완 가이드 반환 (저장 없음, 팝업 작성 중 사용)",
)
async def ai_guide_text(
    data: AIGuideRequest,
    current_login: Login = Depends(get_current_login_user),
) -> AIGuideResponse:
    from server.app.domain.weekly_reports.ai_service import WeeklyReportAIService

    ai_svc = WeeklyReportAIService()
    guide_text = ai_svc.guide(data.this_week)
    return AIGuideResponse(guide=guide_text)


# ─── 이메일 발송 엔드포인트 ───────────────────────────────────────────────────


@router.post(
    "/ai/send-report-email",
    response_model=SendReportEmailResponse,
    summary="AI 브리핑 리포트를 PDF로 변환하여 이메일 발송",
)
async def send_report_email(
    data: SendReportEmailRequest,
    current_login: Login = Depends(get_current_login_user),
) -> SendReportEmailResponse:
    from server.app.domain.weekly_reports.email_service import ReportEmailService

    email_svc = ReportEmailService()
    email_svc.send_report_email(
        recipients=data.recipients,
        pdf_base64=data.pdf_base64,
        year=data.year,
        month=data.month,
        week_number=data.week_number,
        dept_name=data.dept_name,
    )
    return SendReportEmailResponse(
        success=True,
        message=f"{len(data.recipients)}명에게 리포트가 성공적으로 전송되었습니다.",
    )


# ─── 댓글 엔드포인트 ──────────────────────────────────────────────────────────


@router.get(
    "/{no}/comments",
    response_model=list[WeeklyReportCommentResponse],
    summary="댓글 목록 조회 (트리 구조)",
)
async def list_comments(
    no: int,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[WeeklyReportCommentResponse]:
    service = WeeklyReportCommentService(db)
    return await service.list_comments(no)


@router.post(
    "/{no}/comments",
    response_model=WeeklyReportCommentResponse,
    status_code=201,
    summary="댓글 등록",
)
async def create_comment(
    no: int,
    data: WeeklyReportCommentCreate,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportCommentResponse:
    service = WeeklyReportCommentService(db)
    return await service.create_comment(no, current_login, data)


@router.put(
    "/comments/{comment_id}",
    response_model=WeeklyReportCommentResponse,
    summary="댓글 수정 (본인 또는 관리자)",
)
async def update_comment(
    comment_id: int,
    data: WeeklyReportCommentUpdate,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> WeeklyReportCommentResponse:
    service = WeeklyReportCommentService(db)
    return await service.update_comment(comment_id, current_login, data)


@router.delete(
    "/comments/{comment_id}",
    status_code=204,
    summary="댓글 삭제 (본인 또는 관리자)",
)
async def delete_comment(
    comment_id: int,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> None:
    service = WeeklyReportCommentService(db)
    await service.delete_comment(comment_id, current_login)
