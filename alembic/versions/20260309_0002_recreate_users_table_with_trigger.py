"""recreate users table and add login insert trigger

Revision ID: 20260309_0002
Revises: 20260309_0001
Create Date: 2026-03-09 00:00:00.000000

변경 사항:
- users 테이블 완전 재생성
  - id: VARCHAR(255) PRIMARY KEY
  - name: VARCHAR(100) NOT NULL
  - department: VARCHAR(100) nullable
  - email: VARCHAR(255) UNIQUE NOT NULL
  - admin_yn: BOOLEAN DEFAULT FALSE
  - position: VARCHAR(100) nullable
  - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- login 테이블 INSERT 시 users 테이블에 id, name, email, admin_yn, created_at 자동 입력 트리거 재생성
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260309_0002"
down_revision: Union[str, None] = "20260309_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. 기존 트리거 및 트리거 함수 제거
    # ------------------------------------------------------------------ #
    op.execute("DROP TRIGGER IF EXISTS trg_login_to_users ON login")
    op.execute("DROP FUNCTION IF EXISTS sync_login_to_users()")

    # ------------------------------------------------------------------ #
    # 2. FK 제약 조건 제거 (weekly_reports, notice → users.id)
    # ------------------------------------------------------------------ #
    op.drop_constraint("weekly_reports_author_id_fkey", "weekly_reports", type_="foreignkey")
    op.drop_constraint("notice_author_id_fkey", "notice", type_="foreignkey")

    # ------------------------------------------------------------------ #
    # 3. 기존 users 테이블 완전 삭제
    # ------------------------------------------------------------------ #
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # ------------------------------------------------------------------ #
    # 4. users 테이블 신규 생성 (요청한 스키마 기준)
    # ------------------------------------------------------------------ #
    op.create_table(
        "users",
        sa.Column("id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("admin_yn", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("position", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id", name="users_pkey"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------ #
    # 5. FK 제약 조건 재생성
    # ------------------------------------------------------------------ #
    op.create_foreign_key(
        "weekly_reports_author_id_fkey",
        "weekly_reports",
        "users",
        ["author_id"],
        ["id"],
    )
    op.create_foreign_key(
        "notice_author_id_fkey",
        "notice",
        "users",
        ["author_id"],
        ["id"],
    )

    # ------------------------------------------------------------------ #
    # 6. 트리거 함수 생성
    #    login 테이블 INSERT 시 users 테이블에 id, name, email, admin_yn, created_at 자동 입력
    # ------------------------------------------------------------------ #
    op.execute(
        """
        CREATE OR REPLACE FUNCTION sync_login_to_users()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO users (id, name, email, admin_yn, created_at, updated_at)
            VALUES (
                NEW.id,
                NEW.name,
                NEW.email,
                NEW.admin_yn,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO NOTHING;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    # ------------------------------------------------------------------ #
    # 7. 트리거 생성
    #    login 테이블에 새 사용자 INSERT 후 실행
    # ------------------------------------------------------------------ #
    op.execute(
        """
        CREATE TRIGGER trg_login_to_users
            AFTER INSERT ON login
            FOR EACH ROW
            EXECUTE FUNCTION sync_login_to_users();
        """
    )


def downgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. 트리거 및 트리거 함수 제거
    # ------------------------------------------------------------------ #
    op.execute("DROP TRIGGER IF EXISTS trg_login_to_users ON login")
    op.execute("DROP FUNCTION IF EXISTS sync_login_to_users()")

    # ------------------------------------------------------------------ #
    # 2. FK 제약 조건 제거
    # ------------------------------------------------------------------ #
    op.drop_constraint("weekly_reports_author_id_fkey", "weekly_reports", type_="foreignkey")
    op.drop_constraint("notice_author_id_fkey", "notice", type_="foreignkey")

    # ------------------------------------------------------------------ #
    # 3. 재생성된 users 테이블 삭제
    # ------------------------------------------------------------------ #
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # ------------------------------------------------------------------ #
    # 4. 이전 users 테이블 구조 복원 (20260309_0001 기준)
    # ------------------------------------------------------------------ #
    op.create_table(
        "users",
        sa.Column("id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("admin_yn", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("position", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id", name="users_pkey"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------ #
    # 5. FK 제약 조건 재생성
    # ------------------------------------------------------------------ #
    op.create_foreign_key(
        "weekly_reports_author_id_fkey",
        "weekly_reports",
        "users",
        ["author_id"],
        ["id"],
    )
    op.create_foreign_key(
        "notice_author_id_fkey",
        "notice",
        "users",
        ["author_id"],
        ["id"],
    )

    # ------------------------------------------------------------------ #
    # 6. 이전 트리거 복원 (20260309_0001 기준)
    # ------------------------------------------------------------------ #
    op.execute(
        """
        CREATE OR REPLACE FUNCTION sync_login_to_users()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO users (id, name, email, admin_yn, created_at, updated_at)
            VALUES (NEW.id, NEW.name, NEW.email, NEW.admin_yn, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_login_to_users
            AFTER INSERT ON login
            FOR EACH ROW
            EXECUTE FUNCTION sync_login_to_users();
        """
    )
