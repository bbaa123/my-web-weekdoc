"""
Department 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_login_user, get_database_session
from server.app.domain.login.models.login import Login
from server.app.domain.department.schemas.department_schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from server.app.domain.department.service import DepartmentService

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get(
    "",
    response_model=list[DepartmentResponse],
    summary="전체 부서 목록 조회",
)
async def list_departments(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[DepartmentResponse]:
    service = DepartmentService(db)
    return await service.list_departments()


@router.get(
    "/active",
    response_model=list[DepartmentResponse],
    summary="사용 중인 부서 목록 조회 (use_yn = 'Y')",
)
async def list_active_departments(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[DepartmentResponse]:
    service = DepartmentService(db)
    return await service.list_active_departments()


@router.get(
    "/accessible",
    response_model=list[DepartmentResponse],
    summary="현재 사용자가 접근 가능한 부서 목록 조회 (계층 기반)",
)
async def list_accessible_departments(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[DepartmentResponse]:
    service = DepartmentService(db)
    return await service.list_accessible_departments(current_login.id, current_login.admin_yn)


@router.get(
    "/{dept_code}",
    response_model=DepartmentResponse,
    summary="부서 단건 조회",
)
async def get_department(
    dept_code: str,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> DepartmentResponse:
    service = DepartmentService(db)
    try:
        return await service.get_department(dept_code)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="부서 생성",
)
async def create_department(
    data: DepartmentCreate,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> DepartmentResponse:
    service = DepartmentService(db)
    try:
        return await service.create_department(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/{dept_code}",
    response_model=DepartmentResponse,
    summary="부서 수정",
)
async def update_department(
    dept_code: str,
    data: DepartmentUpdate,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> DepartmentResponse:
    service = DepartmentService(db)
    try:
        return await service.update_department(dept_code, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{dept_code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="부서 삭제",
)
async def delete_department(
    dept_code: str,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> None:
    service = DepartmentService(db)
    try:
        await service.delete_department(dept_code)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
