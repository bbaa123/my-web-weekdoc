import asyncio
import asyncpg
import os
import re
from dotenv import load_dotenv

load_dotenv()

async def check():
    raw_url = os.getenv("DATABASE_URL")
    # Parse URL
    m = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", raw_url)
    if not m:
        # try with asyncpg scheme
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
        print(f"--- NOTICE CONSTRAINTS ---")
        rows = await conn.fetch("""
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = 'notice'::regclass
        """)
        for r in rows:
            print(f"Name: {r['conname']}, Type: {r['contype']}")
            
        print(f"\n--- USERS CONSTRAINTS ---")
        rows = await conn.fetch("""
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass
        """)
        for r in rows:
            print(f"Name: {r['conname']}, Type: {r['contype']}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
