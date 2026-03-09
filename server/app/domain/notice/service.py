"""
Notice Service - 공지사항 비즈니스 로직
"""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.login.models.login import Login
from server.app.domain.notice.models.notice import Notice
from server.app.domain.notice.repositories.notice_repository import NoticeRepository
from server.app.domain.notice.schemas.notice_schemas import NoticeCreate, NoticeResponse


class NoticeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = NoticeRepository(db)

    async def list_notices(self) -> list[NoticeResponse]:
        """전체 공지사항 목록 조회"""
        notices = await self.repo.list_all()
        return [NoticeResponse.model_validate(n) for n in notices]

    async def list_active_notices(self) -> list[NoticeResponse]:
        """유효한 공지사항 목록 조회 (end_at >= 현재시각)"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        notices = await self.repo.list_active(now)
        return [NoticeResponse.model_validate(n) for n in notices]

    async def create_notice(
        self, current_login: Login, data: NoticeCreate
    ) -> NoticeResponse:
        """공지사항 생성 (관리자 전용)"""
        if not current_login.admin_yn:
            raise PermissionError("공지사항 등록 권한이 없습니다.")

        notice = Notice(
            id=current_login.id,
            content=data.content,
            start_at=data.start_at,
            end_at=data.end_at,
        )
        notice = await self.repo.create(notice)
        return NoticeResponse.model_validate(notice)

    async def delete_notice(self, current_login: Login, notice_id: int) -> None:
        """공지사항 삭제 (관리자 전용)"""
        if not current_login.admin_yn:
            raise PermissionError("공지사항 삭제 권한이 없습니다.")

        notice = await self.repo.get_by_id(notice_id)
        if not notice:
            raise ValueError("공지사항을 찾을 수 없습니다.")

        await self.repo.delete(notice)
