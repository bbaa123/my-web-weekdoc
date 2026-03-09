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
