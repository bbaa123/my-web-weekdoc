"""
Notice 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NoticeCreate(BaseModel):
    """공지사항 생성 요청"""

    content: str = Field(..., min_length=1)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class NoticeResponse(BaseModel):
    """공지사항 응답"""

    notice_id: int
    id: str
    content: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
