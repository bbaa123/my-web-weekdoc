"""
Login Auth 엔드포인트 - login 테이블 기반 로그인/회원가입
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_current_login_user, get_database_session
from server.app.domain.auth.repositories.user_repository import UserRepository
from server.app.domain.auth.schemas.user_schemas import UserProfileResponse, UserUpsertRequest
from server.app.domain.login.models.login import Login
from server.app.domain.login.repositories.login_repository import LoginRepository
from server.app.domain.login.schemas.login_schemas import (
    ChangePasswordRequest,
    LoginCreate,
    LoginRequest,
    LoginTokenResponse,
    PresenceUserResponse,
)
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


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="로그아웃 (last_logout_at 기록)",
)
async def logout(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> None:
    service = LoginService(db)
    await service.logout(current_login.id)


@router.get(
    "/presence",
    response_model=list[PresenceUserResponse],
    summary="전체 팀원 접속 현황 조회 (인증 사용자 전용)",
)
async def get_presence(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[PresenceUserResponse]:
    from server.app.domain.auth.repositories.user_repository import UserRepository as _UserRepo

    login_repo = LoginRepository(db)
    user_repo = _UserRepo(db)
    logins = await login_repo.list_all()
    result: list[PresenceUserResponse] = []
    for login_user in logins:
        profile = await user_repo.get_by_id(login_user.id)
        result.append(
            PresenceUserResponse(
                id=login_user.id,
                name=profile.name if profile else login_user.name,
                email=login_user.email,
                department=profile.department if profile else None,
                position=profile.position if profile else None,
                nicname=profile.nicname if profile else None,
                picture=profile.picture if profile else None,
                last_login_at=login_user.last_login_at,
                last_logout_at=login_user.last_logout_at,
            )
        )
    return result


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
            tel=user.tel,
            job=user.job,
            nicname=user.nicname,
            remark=user.remark,
            picture=user.picture,
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


@router.post(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="비밀번호 변경",
)
async def change_password(
    data: ChangePasswordRequest,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> None:
    service = LoginService(db)
    try:
        await service.change_password(current_login.id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/users",
    response_model=list[UserProfileResponse],
    summary="전체 사용자 목록 조회 (인증된 사용자 조회 가능, 수정은 관리자 전용)",
)
async def list_all_users(
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> list[UserProfileResponse]:
    login_repo = LoginRepository(db)
    user_repo = UserRepository(db)
    logins = await login_repo.list_all()
    result: list[UserProfileResponse] = []
    for login_user in logins:
        profile = await user_repo.get_by_id(login_user.id)
        if profile:
            result.append(UserProfileResponse(
                id=profile.id,
                name=profile.name,
                email=profile.email,
                department=profile.department,
                position=profile.position,
                admin_yn=login_user.admin_yn,
                tel=profile.tel,
                job=profile.job,
                nicname=profile.nicname,
                remark=profile.remark,
                picture=profile.picture,
                exists_in_users=True,
            ))
        else:
            result.append(UserProfileResponse(
                id=login_user.id,
                name=login_user.name,
                email=login_user.email,
                admin_yn=login_user.admin_yn,
                exists_in_users=False,
            ))
    return result


@router.put(
    "/users/{user_id}",
    response_model=UserProfileResponse,
    summary="특정 사용자 프로필 수정 (관리자 전용)",
)
async def admin_update_user(
    user_id: str,
    data: UserUpsertRequest,
    current_login: Login = Depends(get_current_login_user),
    db: AsyncSession = Depends(get_database_session),
) -> UserProfileResponse:
    if not current_login.admin_yn:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자만 접근 가능합니다.")
    login_repo = LoginRepository(db)
    target_login = await login_repo.get_by_id(user_id)
    if not target_login:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    # login 테이블 admin_yn 동기화
    await login_repo.update_admin_yn(user_id, data.admin_yn)
    user_repo = UserRepository(db)
    user = await user_repo.upsert(
        user_id=user_id,
        name=data.name,
        email=data.email,
        department=data.department,
        position=data.position,
        admin_yn=data.admin_yn,
        tel=data.tel,
        job=data.job,
        nicname=data.nicname,
        remark=data.remark,
        picture=data.picture,
    )
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        department=user.department,
        position=user.position,
        admin_yn=data.admin_yn,
        tel=user.tel,
        job=user.job,
        nicname=user.nicname,
        remark=user.remark,
        picture=user.picture,
        exists_in_users=True,
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
        tel=data.tel,
        job=data.job,
        nicname=data.nicname,
        remark=data.remark,
        picture=data.picture,
    )
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        department=user.department,
        position=user.position,
        admin_yn=user.admin_yn,
        tel=user.tel,
        job=user.job,
        nicname=user.nicname,
        remark=user.remark,
        picture=user.picture,
        exists_in_users=True,
    )
