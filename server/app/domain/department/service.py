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
from server.app.domain.auth.repositories.user_repository import UserRepository


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

    async def list_accessible_departments(self, login_id: str, is_admin: bool) -> list[DepartmentResponse]:
        """
        로그인 사용자가 접근 가능한 부서 목록 조회 (계층 기반).
        - admin: 전체 활성 부서
        - 최상위 부서장 (parent_dept_code 없음): 전체 활성 부서
        - 중간/일반 부서원: 본인 부서 + 직속 하위 부서 (parent_dept_code = 본인 dept_code)
        """
        if is_admin:
            return await self.list_active_departments()

        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(login_id)
        if not user or not user.department:
            return await self.list_active_departments()

        dept = await self.repo.get_by_code(user.department)
        if not dept or not dept.parent_dept_code:
            # 최상위 부서이거나 부서 정보를 찾을 수 없는 경우 전체 반환
            return await self.list_active_departments()

        # 본인 부서 + 직속 하위 부서
        children = await self.repo.list_by_parent_code(user.department)
        own = [DepartmentResponse.model_validate(dept)]
        child_responses = [DepartmentResponse.model_validate(c) for c in children]
        return own + child_responses

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
