import asyncio
import asyncpg
import os
import re
from dotenv import load_dotenv

load_dotenv()

async def verify_raw():
    raw_url = os.getenv("DATABASE_URL")
    m = re.match(r"postgresql(?:\+asyncpg)?://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", raw_url)
    
    if not m:
        print(f"Cannot parse DATABASE_URL")
        return

    db_user = m.group(1)
    db_pass = m.group(2)
    db_host = m.group(3)
    db_port = int(m.group(4))
    db_name = m.group(5)

    try:
        conn = await asyncpg.connect(
            user=db_user,
            password=db_pass,
            host=db_host,
            port=db_port,
            database=db_name,
            statement_cache_size=0, # Disable statement cache for Pgbouncer
        )
        
        print("--- raw asyncpg connection test ---")
        val = await conn.fetchval("SELECT 1")
        print(f"Connection test: SUCCESS (Result: {val})")
        
        version = await conn.fetchval("SELECT version_num FROM alembic_version")
        print(f"Alembic version: {version}")
        
        rows = await conn.fetch("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
        tables = [r['tablename'] for r in rows]
        print(f"Tables: {', '.join(tables)}")
        
        await conn.close()
        return True
    except Exception as e:
        print(f"Connection test: FAILED")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(verify_raw())
