"""Alembic Environment Configuration

Supabase Transaction Pooler(pgbouncer) 환경에서 asyncpg를 직접 사용하여
prepared statement 충돌 없이 마이그레이션을 실행합니다.
"""

import asyncio
import os
import re
import sys
from logging.config import fileConfig
from pathlib import Path

# 프로젝트 루트 디렉토리를 sys.path에 추가
# (alembic/ 폴더의 부모 = 프로젝트 루트)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import pool

# Load environment variables from .env file
load_dotenv()

# This is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models here to ensure they are registered with SQLAlchemy
# This is critical for autogenerate to work properly
from server.app.core.database import Base  # noqa: E402

# Import all domain models to register them with Base.metadata
from server.app.domain.auth.models.user import User  # noqa: F401
from server.app.domain.login.models.login import Login  # noqa: F401
from server.app.domain.notice.models.notice import Notice  # noqa: F401

# Set target metadata for autogenerate support
target_metadata = Base.metadata

# Override sqlalchemy.url from environment variable
database_url = os.getenv("DATABASE_URL")
if database_url:
    # Ensure we're using asyncpg driver
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    config.set_main_option("sqlalchemy.url", database_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using asyncpg directly to bypass pgbouncer prepared statement issues.

    Supabase Transaction Pooler(pgbouncer, port 6543)는 prepared statement를 지원하지 않아
    SQLAlchemy asyncpg dialect 초기화(setup_asyncpg_json_codec 등)에서 오류가 발생합니다.
    asyncpg를 직접 연결하고 Alembic migration을 실행합니다.
    """
    import asyncpg

    raw_url = config.get_main_option("sqlalchemy.url")

    # postgresql+asyncpg://user:pass@host:port/db 에서 접속 정보 추출
    m = re.match(r"postgresql\+asyncpg://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", raw_url)
    if not m:
        raise ValueError(f"Cannot parse DATABASE_URL: {raw_url}")
    db_user = m.group(1)
    db_pass = m.group(2)
    db_host = m.group(3)
    db_port = int(m.group(4))
    db_name = m.group(5)

    # asyncpg 직접 연결 (statement_cache_size=0 → pgbouncer 완전 호환)
    conn = await asyncpg.connect(
        user=db_user,
        password=db_pass,
        host=db_host,
        port=db_port,
        database=db_name,
        statement_cache_size=0,
    )

    try:
        # SQLAlchemy engine을 통해 migration_context 구성

        def run_migrations(sync_conn):
            context.configure(
                connection=sync_conn,
                target_metadata=target_metadata,
                compare_type=True,
                compare_server_default=True,
            )

            with context.begin_transaction():
                context.run_migrations()

        # asyncpg에서 psycopg2-compat blocking connection을 통해 실행
        from sqlalchemy.ext.asyncio import create_async_engine

        # Session Pooler 또는 Direct Connection을 위해 포트 전환 시도
        # Transaction Pooler(6543) → Session Pooler(5432)
        session_url = raw_url.replace(f":{db_port}/", ":5432/")
        if session_url == raw_url:
            # 포트가 이미 5432이거나 다른 경우 그냥 진행
            pass

        # 재시도: Session Pooler URL(5432)로 SQLAlchemy engine 사용
        from sqlalchemy.engine import make_url
        sa_url = make_url(session_url)
        sa_url = sa_url.update_query_dict({"prepared_statement_cache_size": "0"})

        engine = create_async_engine(
            sa_url,
            poolclass=pool.NullPool,
        )

        async with engine.connect() as connection:
            await connection.run_sync(run_migrations)

        await engine.dispose()
    finally:
        await conn.close()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


# Determine which mode to run
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
