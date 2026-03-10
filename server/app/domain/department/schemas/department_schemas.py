"""
Department 도메인 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    """부서 생성 요청"""

    dept_code: str = Field(..., min_length=1, max_length=20)
    dept_name: str = Field(..., min_length=1, max_length=100)
    parent_dept_code: Optional[str] = Field(default=None, max_length=20)
    use_yn: str = Field(default="Y", pattern="^[YN]$")
    dept_level: Optional[int] = None
    sort_order: int = Field(default=0)


class DepartmentUpdate(BaseModel):
    """부서 수정 요청"""

    dept_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    parent_dept_code: Optional[str] = Field(default=None, max_length=20)
    use_yn: Optional[str] = Field(default=None, pattern="^[YN]$")
    dept_level: Optional[int] = None
    sort_order: Optional[int] = None


class DepartmentResponse(BaseModel):
    """부서 응답"""

    dept_code: str
    dept_name: str
    parent_dept_code: Optional[str] = None
    use_yn: str
    dept_level: Optional[int] = None
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}
