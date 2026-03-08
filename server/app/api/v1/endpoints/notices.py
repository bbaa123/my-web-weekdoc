"""
Notice 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_user, get_database_session
from server.app.domain.auth.models.user import User
from server.app.domain.notice.schemas.notice_schemas import NoticeCreate, NoticeResponse
from server.app.domain.notice.service import NoticeService

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get(
    "",
    response_model=list[NoticeResponse],
    summary="전체 공지사항 목록 조회",
)
async def list_notices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[NoticeResponse]:
    service = NoticeService(db)
    return await service.list_notices()


@router.get(
    "/active",
    response_model=list[NoticeResponse],
    summary="유효한 공지사항 목록 조회 (종료일 미만료)",
)
async def list_active_notices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[NoticeResponse]:
    service = NoticeService(db)
    return await service.list_active_notices()


@router.post(
    "",
    response_model=NoticeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="공지사항 등록 (관리자 전용)",
)
async def create_notice(
    data: NoticeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> NoticeResponse:
    service = NoticeService(db)
    try:
        return await service.create_notice(current_user, data)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete(
    "/{notice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="공지사항 삭제 (관리자 전용)",
)
async def delete_notice(
    notice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> None:
    service = NoticeService(db)
    try:
        await service.delete_notice(current_user, notice_id)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
