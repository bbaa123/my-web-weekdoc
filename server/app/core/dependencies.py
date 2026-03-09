"""
FastAPI 공통 의존성 (Dependencies)

라우터에서 사용할 수 있는 재사용 가능한 의존성 함수들을 정의합니다.
"""

from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.app.core.config import settings
from server.app.core.database import get_db


# ====================
# Database Dependency
# ====================


async def get_database_session() -> AsyncSession:
    """데이터베이스 세션 의존성"""
    async for session in get_db():
        yield session


# ====================
# Authentication Dependencies
# ====================


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_database_session),
):
    """
    현재 인증된 사용자 정보를 반환합니다.
    Authorization: Bearer <token> 헤더에서 JWT를 파싱합니다.
    """
    from server.app.domain.auth.service import AuthService

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 형식입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    service = AuthService(db)
    user = await service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_login_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_database_session),
):
    """
    login 테이블 기반 인증 사용자 반환.
    Authorization: Bearer <token> 헤더에서 JWT를 파싱합니다.
    """
    from server.app.domain.auth.service import decode_access_token
    from server.app.domain.login.repositories.login_repository import LoginRepository

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 형식입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(parts[1])
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    login_id = payload.get("sub")
    if not login_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰 페이로드입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    repo = LoginRepository(db)
    login_user = await repo.get_by_id(login_id)
    if not login_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return login_user


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_database_session),
) -> Optional[object]:
    """선택적 인증: 토큰이 있으면 검증하고, 없으면 None 반환"""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization, db)
    except HTTPException:
        return None


# ====================
# Pagination Dependencies
# ====================


class PaginationParams:
    """페이지네이션 파라미터"""

    def __init__(self, skip: int = 0, limit: int = 100):
        self.skip = max(0, skip)
        self.limit = min(1000, max(1, limit))


async def get_pagination(skip: int = 0, limit: int = 100) -> PaginationParams:
    return PaginationParams(skip=skip, limit=limit)


# ====================
# Request Context Dependencies
# ====================


class RequestContext:
    """요청 컨텍스트"""

    def __init__(
        self,
        user_id: Optional[int] = None,
        request_id: Optional[str] = None,
        client_ip: Optional[str] = None,
    ):
        self.user_id = user_id
        self.request_id = request_id
        self.client_ip = client_ip


async def get_request_context(
    user=Depends(get_optional_current_user),
    x_request_id: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
) -> RequestContext:
    user_id = user.id if user else None
    client_ip = x_forwarded_for.split(",")[0] if x_forwarded_for else None
    return RequestContext(user_id=user_id, request_id=x_request_id, client_ip=client_ip)
