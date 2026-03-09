"""
WeeklyReport 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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


class TeamWeeklyReportResponse(WeeklyReportResponse):
    """팀 주간보고 응답 (작성자 이름 및 부서 포함)"""

    author_name: str = ""
    department: Optional[str] = None
