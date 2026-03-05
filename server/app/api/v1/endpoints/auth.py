"""
Auth 엔드포인트 - 로그인/회원가입
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_user, get_database_session
from server.app.domain.auth.models.user import User
from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.auth.schemas.user_schemas import TokenResponse, UserCreate, UserLogin, UserResponse
from server.app.domain.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_database_session),
) -> TokenResponse:
    service = AuthService(db)
    try:
        return await service.register(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="로그인",
)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_database_session),
) -> TokenResponse:
    service = AuthService(db)
    try:
        return await service.login(data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="전체 사용자 목록 조회 (관리자용)",
)
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[UserResponse]:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자만 접근 가능합니다.")
    repo = UserRepository(db)
    return await repo.list_all()
