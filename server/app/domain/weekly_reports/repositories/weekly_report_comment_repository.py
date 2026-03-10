"""
WeeklyReportComment Repository - DB 접근 계층
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.weekly_reports.models.weekly_report_comment import WeeklyReportComment
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    WeeklyReportCommentCreate,
    WeeklyReportCommentUpdate,
)


class WeeklyReportCommentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_report(self, weekly_reports_no: int) -> list[WeeklyReportComment]:
        """특정 보고서의 전체 댓글 목록 (created_at 오름차순)"""
        result = await self.db.execute(
            select(WeeklyReportComment)
            .where(WeeklyReportComment.weekly_reports_no == weekly_reports_no)
            .order_by(WeeklyReportComment.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, comment_id: int) -> WeeklyReportComment | None:
        """PK로 단건 조회"""
        result = await self.db.execute(
            select(WeeklyReportComment).where(WeeklyReportComment.comment_id == comment_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        weekly_reports_no: int,
        login_id: str,
        data: WeeklyReportCommentCreate,
    ) -> WeeklyReportComment:
        """댓글 등록"""
        comment = WeeklyReportComment(
            weekly_reports_no=weekly_reports_no,
            id=login_id,
            content=data.content,
            parent_comment_id=data.parent_comment_id,
        )
        self.db.add(comment)
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def update(
        self, comment: WeeklyReportComment, data: WeeklyReportCommentUpdate
    ) -> WeeklyReportComment:
        """댓글 수정"""
        comment.content = data.content
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def delete(self, comment: WeeklyReportComment) -> None:
        """댓글 삭제"""
        await self.db.delete(comment)
        await self.db.flush()
