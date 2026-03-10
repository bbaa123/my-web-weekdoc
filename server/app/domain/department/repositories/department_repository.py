"""
Department Repository - DB 접근 계층
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.department.models.department import Department


class DepartmentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_all(self) -> list[Department]:
        """전체 부서 목록 (sort_order, dept_code 순)"""
        result = await self.db.execute(
            select(Department).order_by(Department.sort_order.asc(), Department.dept_code.asc())
        )
        return list(result.scalars().all())

    async def list_active(self) -> list[Department]:
        """사용 중인 부서 목록 (use_yn = 'Y')"""
        result = await self.db.execute(
            select(Department)
            .where(Department.use_yn == "Y")
            .order_by(Department.sort_order.asc(), Department.dept_code.asc())
        )
        return list(result.scalars().all())

    async def get_by_code(self, dept_code: str) -> Optional[Department]:
        result = await self.db.execute(
            select(Department).where(Department.dept_code == dept_code)
        )
        return result.scalar_one_or_none()

    async def create(self, department: Department) -> Department:
        self.db.add(department)
        await self.db.commit()
        await self.db.refresh(department)
        return department

    async def update(self, department: Department) -> Department:
        await self.db.commit()
        await self.db.refresh(department)
        return department

    async def delete(self, department: Department) -> None:
        await self.db.delete(department)
        await self.db.commit()
