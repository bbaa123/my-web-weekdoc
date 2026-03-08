"""
Login Auth 엔드포인트 - login 테이블 기반 로그인/회원가입
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.dependencies import get_database_session
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
