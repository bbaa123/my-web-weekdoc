"""
WeeklyReport 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WeeklyReportCreate(BaseModel):
    """주간보고 등록 요청"""

    year: str = Field(..., pattern=r"^(2026|2027|2028|2029|2030)$")
    month: str = Field(..., pattern=r"^(0[1-9]|1[0-2])$")
    week_number: str = Field(..., pattern=r"^[1-5]주차$")
    company: Optional[str] = None
    work_type: Optional[str] = None
    project_name: Optional[str] = None
    this_week: Optional[str] = None
    next_week: Optional[str] = None
    progress: int = Field(default=0, ge=0, le=100)
    priority: Optional[str] = None
    issues: Optional[str] = None
    status: Optional[str] = None


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
