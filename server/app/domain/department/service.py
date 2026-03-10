"""
Department Service - 부서 관리 비즈니스 로직
"""

from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.department.models.department import Department
from server.app.domain.department.repositories.department_repository import DepartmentRepository
from server.app.domain.department.schemas.department_schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)


class DepartmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = DepartmentRepository(db)

    async def list_departments(self) -> list[DepartmentResponse]:
        """전체 부서 목록 조회"""
        departments = await self.repo.list_all()
        return [DepartmentResponse.model_validate(d) for d in departments]

    async def list_active_departments(self) -> list[DepartmentResponse]:
        """사용 중인 부서 목록 조회"""
        departments = await self.repo.list_active()
        return [DepartmentResponse.model_validate(d) for d in departments]

    async def get_department(self, dept_code: str) -> DepartmentResponse:
        """부서 단건 조회"""
        department = await self.repo.get_by_code(dept_code)
        if not department:
            raise ValueError(f"부서를 찾을 수 없습니다: {dept_code}")
        return DepartmentResponse.model_validate(department)

    async def create_department(self, data: DepartmentCreate) -> DepartmentResponse:
        """부서 생성"""
        existing = await self.repo.get_by_code(data.dept_code)
        if existing:
            raise ValueError(f"이미 존재하는 부서 코드입니다: {data.dept_code}")

        if data.parent_dept_code:
            parent = await self.repo.get_by_code(data.parent_dept_code)
            if not parent:
                raise ValueError(f"상위 부서를 찾을 수 없습니다: {data.parent_dept_code}")

        department = Department(
            dept_code=data.dept_code,
            dept_name=data.dept_name,
            parent_dept_code=data.parent_dept_code,
            use_yn=data.use_yn,
            dept_level=data.dept_level,
            sort_order=data.sort_order,
        )
        department = await self.repo.create(department)
        return DepartmentResponse.model_validate(department)

    async def update_department(self, dept_code: str, data: DepartmentUpdate) -> DepartmentResponse:
        """부서 수정"""
        department = await self.repo.get_by_code(dept_code)
        if not department:
            raise ValueError(f"부서를 찾을 수 없습니다: {dept_code}")

        if data.parent_dept_code is not None:
            if data.parent_dept_code == dept_code:
                raise ValueError("자기 자신을 상위 부서로 지정할 수 없습니다.")
            parent = await self.repo.get_by_code(data.parent_dept_code)
            if not parent:
                raise ValueError(f"상위 부서를 찾을 수 없습니다: {data.parent_dept_code}")

        if data.dept_name is not None:
            department.dept_name = data.dept_name
        if data.parent_dept_code is not None:
            department.parent_dept_code = data.parent_dept_code
        if data.use_yn is not None:
            department.use_yn = data.use_yn
        if data.dept_level is not None:
            department.dept_level = data.dept_level
        if data.sort_order is not None:
            department.sort_order = data.sort_order

        department = await self.repo.update(department)
        return DepartmentResponse.model_validate(department)

    async def delete_department(self, dept_code: str) -> None:
        """부서 삭제"""
        department = await self.repo.get_by_code(dept_code)
        if not department:
            raise ValueError(f"부서를 찾을 수 없습니다: {dept_code}")
        await self.repo.delete(department)
