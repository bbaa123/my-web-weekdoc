"""
Login Auth 엔드포인트 - login 테이블 기반 로그인/회원가입
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_login_user, get_database_session
from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.auth.schemas.user_schemas import UserProfileResponse, UserUpsertRequest
from server.app.domain.login.models.login import Login
from server.app.domain.login.schemas.login_schemas import LoginCreate, LoginRequest, LoginTokenResponse
from server.app.domain.login.service import LoginService

router = APIRouter(prefix="/login-auth", tags=["login-auth"])


@router.post(
    "/register",
    response_model=LoginTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입 (login 테이블)",
)
async def register(
    data: LoginCreate,
    db: AsyncSession = Depends(get_database_session),
) -> LoginTokenResponse:
    service = LoginService(db)
    try:
        return await service.register(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    response_model=LoginTokenResponse,
    summary="로그인 (login 테이블)",
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_database_session),
) -> LoginTokenResponse:
    service = LoginService(db)
    try:
        return await service.login(data.id, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="내 프로필 조회 (users 테이블 기반, login 기본값 포함)",
)
async def get_my_profile(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> UserProfileResponse:
    repo = UserRepository(db)
    user = await repo.get_by_id(current_login.id)
    if user:
        return UserProfileResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            department=user.department,
            position=user.position,
            admin_yn=user.admin_yn,
            exists_in_users=True,
        )
    # users 테이블에 없으면 login 기본값으로 응답
    return UserProfileResponse(
        id=current_login.id,
        name=current_login.name,
        email=current_login.email,
        department=None,
        position=None,
        admin_yn=current_login.admin_yn,
        exists_in_users=False,
    )


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    summary="내 프로필 저장/수정 (users 테이블 Upsert)",
)
async def upsert_my_profile(
    data: UserUpsertRequest,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> UserProfileResponse:
    repo = UserRepository(db)
    user = await repo.upsert(
        user_id=current_login.id,
        name=data.name,
        email=data.email,
        department=data.department,
        position=data.position,
        admin_yn=data.admin_yn,
    )
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        department=user.department,
        position=user.position,
        admin_yn=user.admin_yn,
        exists_in_users=True,
    )
