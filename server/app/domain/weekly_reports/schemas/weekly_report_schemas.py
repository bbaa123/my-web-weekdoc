"""
WeeklyReport 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class WeeklyReportResponse(BaseModel):
    """주간보고 응답"""

    weekly_reports_no: int
    id: str
    year: str
    month: str
    week_number: str
    company: Optional[str] = None
    work_type: Optional[str] = None
    project_name: Optional[str] = None
    this_week: Optional[str] = None
    next_week: Optional[str] = None
    progress: int
    priority: Optional[str] = None
    issues: Optional[str] = None
    status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    feedback: Optional[str] = None
    summary: Optional[str] = None

    model_config = {"from_attributes": True}


class WeeklyReportCreate(BaseModel):
    """주간보고 등록 요청"""

    year: str
    month: str
    week_number: str
    company: Optional[str] = None
    work_type: Optional[str] = None
    project_name: Optional[str] = None
    this_week: Optional[str] = None
    next_week: Optional[str] = None
    progress: int = 0
    priority: Optional[str] = None
    issues: Optional[str] = None
    status: Optional[str] = None


class WeeklyReportUpdate(BaseModel):
    """주간보고 수정 요청"""

    year: Optional[str] = None
    month: Optional[str] = None
    week_number: Optional[str] = None
    company: Optional[str] = None
    work_type: Optional[str] = None
    project_name: Optional[str] = None
    this_week: Optional[str] = None
    next_week: Optional[str] = None
    progress: Optional[int] = None
    priority: Optional[str] = None
    issues: Optional[str] = None
    status: Optional[str] = None
    summary: Optional[str] = None


class TeamWeeklyReportResponse(WeeklyReportResponse):
    """팀 주간보고 응답 (작성자 이름 및 부서 포함)"""

    author_name: str = ""
    department: Optional[str] = None


# ─── AI 스키마 ───────────────────────────────────────────────────────────────


class AISummarizeResponse(BaseModel):
    """AI 요약 응답"""

    summary: str
    weekly_reports_no: int


class AIGuideResponse(BaseModel):
    """AI 보완 가이드 응답"""

    guide: str


class AIGuideRequest(BaseModel):
    """AI 보완 가이드 요청 (텍스트 직접 전달)"""

    this_week: str


# ─── AI 센터 브리핑 스키마 ────────────────────────────────────────────────────


class AICenterBriefingRequest(BaseModel):
    """AI 센터 종합 브리핑 요청"""

    year: str
    month: str
    week_number: str
    department: Optional[str] = None


class DeptStatItem(BaseModel):
    """부서별 통계 항목"""

    dept: str
    completed: int
    total: int


class AICenterBriefingResponse(BaseModel):
    """AI 센터 종합 브리핑 응답"""

    briefing: str
    total_reports: int
    status_stats: dict[str, int]
    dept_stats: list[DeptStatItem]


# ─── 이메일 발송 스키마 ───────────────────────────────────────────────────────


class SendReportEmailRequest(BaseModel):
    """PDF 리포트 이메일 발송 요청"""

    recipients: list[str]
    pdf_base64: str
    year: str
    month: str
    week_number: str
    dept_name: str


class SendReportEmailResponse(BaseModel):
    """PDF 리포트 이메일 발송 응답"""

    success: bool
    message: str


# ─── 댓글 스키마 ─────────────────────────────────────────────────────────────


class WeeklyReportCommentResponse(BaseModel):
    """댓글 응답"""

    comment_id: int
    weekly_reports_no: int
    id: str
    commenter_name: str = ""
    content: str
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    replies: list["WeeklyReportCommentResponse"] = []

    model_config = {"from_attributes": True}


class WeeklyReportCommentCreate(BaseModel):
    """댓글 등록 요청"""

    content: str
    parent_comment_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be empty")
        return v


class WeeklyReportCommentUpdate(BaseModel):
    """댓글 수정 요청"""

    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be empty")
        return v
