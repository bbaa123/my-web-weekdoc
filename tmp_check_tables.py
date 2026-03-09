import asyncio
import os
import re

from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

m = re.match(r"postgresql\+asyncpg://([^:]+):([^@]+)@([^:]+):(\d+)/(\S+)", url)
user, password, host, port, db = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)


async def fix():
    import asyncpg

    conn = await asyncpg.connect(
        user=user,
        password=password,
        host=host,
        port=int(port),
        database=db,
        statement_cache_size=0,
    )
    # alembic_version을 20260306_0001로 되돌림 (notice 테이블 추가 전 상태)
    await conn.execute("UPDATE alembic_version SET version_num = '20260306_0001'")
    versions = await conn.fetch("SELECT version_num FROM alembic_version")
    print("Alembic version set to:", [v["version_num"] for v in versions])
    await conn.close()


asyncio.run(fix())
