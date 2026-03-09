import asyncio
import asyncpg
import os
import re
from dotenv import load_dotenv

load_dotenv()

async def fix():
    raw_url = os.getenv("DATABASE_URL")
    m = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", raw_url)
    if not m:
        m = re.match(r"postgresql\+asyncpg://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", raw_url)
    
    if not m:
        print(f"Cannot parse DATABASE_URL")
        return

    db_user = m.group(1)
    db_pass = m.group(2)
    db_host = m.group(3)
    db_port = int(m.group(4))
    db_name = m.group(5)

    conn = await asyncpg.connect(
        user=db_user,
        password=db_pass,
        host=db_host,
        port=db_port,
        database=db_name,
        statement_cache_size=0,
    )
    
    try:
        print(f"Forcing alembic_version to 20260309_0003...")
        await conn.execute("UPDATE alembic_version SET version_num = '20260309_0003'")
        print("Success.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix())
