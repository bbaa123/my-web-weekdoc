"""update users table and add login trigger

Revision ID: 20260309_0001
Revises: 20260308_0001
Create Date: 2026-03-09 00:00:00.000000

변경 사항:
- users 테이블 구조 변경
  - id: Integer autoincrement → VARCHAR(255)
  - department: NOT NULL → nullable
  - position: VARCHAR(50) NOT NULL → VARCHAR(100) nullable
  - is_admin 컬럼 → admin_yn 으로 변경
  - role, hashed_password, is_active 컬럼 제거
- weekly_reports.author_id: Integer → VARCHAR(255)
- notice.author_id: Integer → VARCHAR(255)
- login INSERT 시 users 테이블에 자동 동기화하는 DB 트리거 추가
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260309_0001"
down_revision: Union[str, None] = "20260308_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. FK 제약 조건 제거 (notice → users.id)
    # ※ weekly_reports 테이블은 이 시점에 DB에 존재하지 않으므로 생략
    # ------------------------------------------------------------------ #
    op.drop_constraint("fk_notice_author_id_users", "notice", type_="foreignkey")

    # ------------------------------------------------------------------ #
    # 2. users 테이블 PK 제약 조건 제거 후 id 컬럼 타입 변경
    # ------------------------------------------------------------------ #
    op.drop_constraint("pk_users", "users", type_="primary")
    op.execute("ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR")
    op.create_primary_key("pk_users", "users", ["id"])

    # ------------------------------------------------------------------ #
    # 3. users 테이블 컬럼 변경
    # ------------------------------------------------------------------ #
    # is_admin → admin_yn 컬럼명 변경
    op.alter_column("users", "is_admin", new_column_name="admin_yn")

    # department: NOT NULL 제약 해제
    op.alter_column("users", "department", nullable=True)

    # position: VARCHAR(50) NOT NULL → VARCHAR(100) nullable
    op.execute("ALTER TABLE users ALTER COLUMN position TYPE VARCHAR(100)")
    op.alter_column("users", "position", nullable=True)

    # 불필요한 컬럼 제거
    op.drop_column("users", "role")
    op.drop_column("users", "hashed_password")
    op.drop_column("users", "is_active")

    # ------------------------------------------------------------------ #
    # 4. notice.author_id 타입 변경 (Integer → VARCHAR(255))
    # ------------------------------------------------------------------ #
    op.execute(
        "ALTER TABLE notice ALTER COLUMN author_id TYPE VARCHAR(255) USING author_id::VARCHAR"
    )

    # ------------------------------------------------------------------ #
    # 5. FK 제약 조건 재생성 (notice만)
    # ※ weekly_reports 테이블은 존재하지 않으므로 생략
    # ------------------------------------------------------------------ #
    op.create_foreign_key(
        "fk_notice_author_id_users",
        "notice",
        "users",
        ["author_id"],
        ["id"],
    )

    # ------------------------------------------------------------------ #
    # 7. 트리거 함수 생성
    #    login 테이블에 INSERT 시 users 테이블에 자동 동기화
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

    # ------------------------------------------------------------------ #
    # 8. 트리거 생성
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
    # 2. FK 제약 조건 제거 (notice만)
    # ※ weekly_reports 테이블은 존재하지 않으므로 생략
    # ------------------------------------------------------------------ #
    op.drop_constraint("fk_notice_author_id_users", "notice", type_="foreignkey")

    # ------------------------------------------------------------------ #
    # 3. notice.author_id 타입 복원
    # ------------------------------------------------------------------ #
    op.execute(
        "ALTER TABLE notice ALTER COLUMN author_id TYPE INTEGER USING author_id::INTEGER"
    )

    # ------------------------------------------------------------------ #
    # 4. users 테이블 복원
    # ------------------------------------------------------------------ #
    # 컬럼 복원
    op.add_column("users", sa.Column("role", sa.String(100), nullable=False, server_default=""))
    op.add_column(
        "users", sa.Column("hashed_password", sa.String(255), nullable=False, server_default="")
    )
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    # admin_yn → is_admin
    op.alter_column("users", "admin_yn", new_column_name="is_admin")

    # department, position NOT NULL 복원
    op.alter_column("users", "department", nullable=False)
    op.execute("ALTER TABLE users ALTER COLUMN position TYPE VARCHAR(50)")
    op.alter_column("users", "position", nullable=False)

    # id 타입 복원 (VARCHAR → Integer)
    op.drop_constraint("pk_users", "users", type_="primary")
    op.execute("ALTER TABLE users ALTER COLUMN id TYPE INTEGER USING id::INTEGER")
    op.create_primary_key("pk_users", "users", ["id"])

    # ------------------------------------------------------------------ #
    # 5. FK 제약 조건 재생성 (notice만)
    # ※ weekly_reports 테이블은 존재하지 않으므로 생략
    # ------------------------------------------------------------------ #
    op.create_foreign_key(
        "fk_notice_author_id_users",
        "notice",
        "users",
        ["author_id"],
        ["id"],
    )
