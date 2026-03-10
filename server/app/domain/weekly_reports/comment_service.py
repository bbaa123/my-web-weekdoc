"""
WeeklyReportComment Service - 댓글 비즈니스 로직
"""

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.login.models.login import Login
from server.app.domain.weekly_reports.repositories.weekly_report_comment_repository import (
    WeeklyReportCommentRepository,
)
from server.app.domain.weekly_reports.repositories.weekly_report_repository import (
    WeeklyReportRepository,
)
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import (
    WeeklyReportCommentCreate,
    WeeklyReportCommentResponse,
    WeeklyReportCommentUpdate,
)


class WeeklyReportCommentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = WeeklyReportCommentRepository(db)
        self.report_repo = WeeklyReportRepository(db)

    async def _get_commenter_name(self, login_id: str) -> str:
        """작성자 이름 조회 (없으면 ID 반환)"""
        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(login_id)
        return user.name if user else login_id

    def _build_comment_tree(
        self,
        comments: list,
        names: dict[str, str],
    ) -> list[WeeklyReportCommentResponse]:
        """댓글 목록을 트리 구조(부모-대댓글)로 변환"""
        comment_map: dict[int, WeeklyReportCommentResponse] = {}
        roots: list[WeeklyReportCommentResponse] = []

        for c in comments:
            resp = WeeklyReportCommentResponse(
                comment_id=c.comment_id,
                weekly_reports_no=c.weekly_reports_no,
                id=c.id,
                commenter_name=names.get(c.id, c.id),
                content=c.content,
                parent_comment_id=c.parent_comment_id,
                created_at=c.created_at,
                updated_at=c.updated_at,
                replies=[],
            )
            comment_map[c.comment_id] = resp

        for c in comments:
            resp = comment_map[c.comment_id]
            if c.parent_comment_id and c.parent_comment_id in comment_map:
                comment_map[c.parent_comment_id].replies.append(resp)
            else:
                roots.append(resp)

        return roots

    async def list_comments(
        self, weekly_reports_no: int
    ) -> list[WeeklyReportCommentResponse]:
        """특정 보고서의 댓글 목록 조회 (트리 구조)"""
        report = await self.report_repo.get_by_no(weekly_reports_no)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        comments = await self.repo.list_by_report(weekly_reports_no)
        # 작성자 이름 일괄 조회
        unique_ids = list({c.id for c in comments})
        user_repo = UserRepository(self.db)
        names: dict[str, str] = {}
        for uid in unique_ids:
            user = await user_repo.get_by_id(uid)
            names[uid] = user.name if user else uid

        return self._build_comment_tree(comments, names)

    async def create_comment(
        self,
        weekly_reports_no: int,
        current_login: Login,
        data: WeeklyReportCommentCreate,
    ) -> WeeklyReportCommentResponse:
        """댓글 등록"""
        report = await self.report_repo.get_by_no(weekly_reports_no)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        if data.parent_comment_id:
            parent = await self.repo.get_by_id(data.parent_comment_id)
            if not parent or parent.weekly_reports_no != weekly_reports_no:
                raise HTTPException(status_code=404, detail="Parent comment not found")

        comment = await self.repo.create(weekly_reports_no, current_login.id, data)
        await self.db.commit()
        await self.db.refresh(comment)

        commenter_name = await self._get_commenter_name(current_login.id)
        return WeeklyReportCommentResponse(
            comment_id=comment.comment_id,
            weekly_reports_no=comment.weekly_reports_no,
            id=comment.id,
            commenter_name=commenter_name,
            content=comment.content,
            parent_comment_id=comment.parent_comment_id,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            replies=[],
        )

    async def update_comment(
        self,
        comment_id: int,
        current_login: Login,
        data: WeeklyReportCommentUpdate,
    ) -> WeeklyReportCommentResponse:
        """댓글 수정 (본인 또는 관리자만 가능)"""
        comment = await self.repo.get_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        if not current_login.admin_yn and comment.id != current_login.id:
            raise HTTPException(status_code=403, detail="Forbidden")

        updated = await self.repo.update(comment, data)
        await self.db.commit()

        commenter_name = await self._get_commenter_name(updated.id)
        return WeeklyReportCommentResponse(
            comment_id=updated.comment_id,
            weekly_reports_no=updated.weekly_reports_no,
            id=updated.id,
            commenter_name=commenter_name,
            content=updated.content,
            parent_comment_id=updated.parent_comment_id,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
            replies=[],
        )

    async def delete_comment(self, comment_id: int, current_login: Login) -> None:
        """댓글 삭제 (본인 또는 관리자만 가능)"""
        comment = await self.repo.get_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        if not current_login.admin_yn and comment.id != current_login.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        await self.repo.delete(comment)
        await self.db.commit()
