"""
API v1 라우터 통합

모든 v1 엔드포인트를 하나의 라우터로 통합합니다.
"""

from fastapi import APIRouter

from server.app.api.v1.endpoints import sample, docs, system, auth, login_auth, notices, weekly_reports, departments

# v1 메인 라우터 생성
api_router = APIRouter()

# 각 도메인의 라우터를 포함
api_router.include_router(
    sample.router,
    # prefix는 이미 sample.router에 정의되어 있음
)

# 문서 제공 라우터
api_router.include_router(
    docs.router,
    # prefix는 이미 docs.router에 정의되어 있음
)

# System 도메인 라우터
api_router.include_router(
    system.router,
    # prefix는 이미 system.router에 정의되어 있음
)

# Auth 도메인 라우터
api_router.include_router(auth.router)

# Login Auth 도메인 라우터 (login 테이블 기반)
api_router.include_router(login_auth.router)

# Notice 도메인 라우터
api_router.include_router(notices.router)

# WeeklyReport 도메인 라우터
api_router.include_router(weekly_reports.router)

# Department 도메인 라우터
api_router.include_router(departments.router)


# 헬스체크 엔드포인트 (v1 루트)
@api_router.get(
    "/health",
    tags=["health"],
    summary="API 헬스체크",
    description="API v1의 전체 상태를 확인합니다.",
)
async def health_check() -> dict:
    """
    전체 API 헬스체크

    Returns:
        dict: API 상태 정보
    """
    db_status = "disconnected"
    try:
        from server.app.core.database import engine
        from sqlalchemy import text
        import asyncio
        
        async with engine.connect() as conn:
            await asyncio.wait_for(conn.execute(text("SELECT 1")), timeout=3.0)
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if "error" not in db_status and db_status == "connected" else "unhealthy",
        "database": db_status,
        "version": "1.0.0",
        "api": "v1",
    }
