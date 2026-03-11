"""
Department Service - 부서 관리 비즈니스 로직
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.domain.department.models.department import Department
from server.app.domain.department.repositories.department_repository import DepartmentRepository
from server.app.domain.department.schemas.department_schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    OrgChartDeptResponse,
    OrgChartUserItem,
)
from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.auth.models.user import User
from server.app.domain.weekly_reports.models.weekly_report import WeeklyReport


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

    async def get_org_chart(self) -> list[OrgChartDeptResponse]:
        """조직도 데이터 조회: 활성 부서 목록 + 각 부서 소속 사용자 + 최근 주간보고 상태"""
        # 1. 활성 부서 목록 조회
        departments = await self.repo.list_active()

        # 2. 전체 사용자 조회 (users 테이블)
        users_result = await self.db.execute(select(User).order_by(User.name))
        all_users: list[User] = list(users_result.scalars().all())

        # 3. 사용자별 최근 주간보고 조회 (submitted_at 기준 최신 1건)
        user_latest_report: dict[str, WeeklyReport] = {}
        if all_users:
            user_ids = [u.id for u in all_users]
            # 각 사용자의 최신 보고서를 서브쿼리로 가져오기
            from sqlalchemy import func
            subq = (
                select(
                    WeeklyReport.id,
                    func.max(WeeklyReport.weekly_reports_no).label("max_no"),
                )
                .where(WeeklyReport.id.in_(user_ids))
                .group_by(WeeklyReport.id)
                .subquery()
            )
            reports_result = await self.db.execute(
                select(WeeklyReport).join(
                    subq,
                    (WeeklyReport.id == subq.c.id)
                    & (WeeklyReport.weekly_reports_no == subq.c.max_no),
                )
            )
            for report in reports_result.scalars().all():
                user_latest_report[report.id] = report

        # 4. 부서코드/부서명 세트 구성 (users.department 매칭용)
        dept_by_code = {d.dept_code: d for d in departments}
        dept_by_name = {d.dept_name: d for d in departments}

        # 5. 부서별 사용자 그룹화
        dept_users: dict[str, list[OrgChartUserItem]] = {d.dept_code: [] for d in departments}
        for user in all_users:
            user_dept_code: str | None = None
            if user.department:
                if user.department in dept_by_code:
                    user_dept_code = user.department
                elif user.department in dept_by_name:
                    user_dept_code = dept_by_name[user.department].dept_code

            if user_dept_code and user_dept_code in dept_users:
                report = user_latest_report.get(user.id)
                dept_users[user_dept_code].append(
                    OrgChartUserItem(
                        id=user.id,
                        name=user.name,
                        position=user.position,
                        email=user.email,
                        tel=user.tel,
                        job=user.job,
                        nicname=user.nicname,
                        picture=user.picture,
                        latest_report_year=report.year if report else None,
                        latest_report_month=report.month if report else None,
                        latest_report_week=report.week_number if report else None,
                        latest_report_status=report.status if report else None,
                    )
                )

        # 6. 응답 조합
        return [
            OrgChartDeptResponse(
                dept_code=dept.dept_code,
                dept_name=dept.dept_name,
                parent_dept_code=dept.parent_dept_code,
                dept_level=dept.dept_level,
                sort_order=dept.sort_order,
                users=dept_users.get(dept.dept_code, []),
            )
            for dept in departments
        ]
