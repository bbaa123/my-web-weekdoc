"""
Notice 도메인 스키마
"""

from datetime import date, datetime

from pydantic import BaseModel, Field


class NoticeCreate(BaseModel):
    """공지사항 생성 요청"""

    content: str = Field(..., min_length=1)
    start_at: date
    end_at: date


class NoticeResponse(BaseModel):
    """공지사항 응답"""

    id: int
    author_id: int
    author_name: str
    seq_no: int
    content: str
    start_at: date
    end_at: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
