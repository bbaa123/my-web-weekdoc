"""
WeeklyReport 도메인 스키마
"""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class WeeklyReportCreate(BaseModel):
    """주간보고서 생성 요청"""

    work_type: Literal["일반", "프로젝트", "지원", "기타"]
    project_name: Optional[str] = None
    summary: str = Field(..., min_length=1)
    progress: int = Field(default=0, ge=0, le=100)
    priority: Literal["상", "중", "하"] = "중"
    issues: Optional[str] = None
    week_start: Optional[date] = None  # 미입력 시 현재 주의 월요일로 설정


class WeeklyReportUpdate(BaseModel):
    """주간보고서 수정 요청"""

    work_type: Optional[Literal["일반", "프로젝트", "지원", "기타"]] = None
    project_name: Optional[str] = None
    summary: Optional[str] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    priority: Optional[Literal["상", "중", "하"]] = None
    issues: Optional[str] = None
    status: Optional[str] = None
    feedback: Optional[str] = None


class WeeklyReportResponse(BaseModel):
    """주간보고서 응답"""

    id: int
    author_id: int
    author_name: str
    week_start: date
    year: int
    month: int
    week_number: int
    work_type: str
    project_name: Optional[str]
    summary: str
    progress: int
    priority: str
    issues: Optional[str]
    status: str
    submitted_at: Optional[datetime]
    feedback: Optional[str]
    feedback_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WeeklyReportFilter(BaseModel):
    """주간보고서 조회 필터"""

    year: Optional[int] = None
    month: Optional[int] = None
    week_number: Optional[int] = None
    author_id: Optional[int] = None  # 관리자용: 특정 멤버 조회
