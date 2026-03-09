import asyncio
import asyncpg
import os
import re
from dotenv import load_dotenv

load_dotenv()

async def check():
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
        print(f"--- NOTICE COLUMNS ---")
        rows = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notice'
        """)
        for r in rows:
            print(f"{r['column_name']}: {r['data_type']}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
