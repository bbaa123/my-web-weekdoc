import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_connection():
    # Use the same URL as in .env
    db_url = "postgresql+asyncpg://postgres.iqihwatbdqhbtonzfupc:rnjswjddk84@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
    print(f"Testing connection to: {db_url}")
    
    engine = create_async_engine(db_url, connect_args={"statement_cache_size": 0})
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("Successfully connected to the database!")
            print(f"Result: {result.fetchone()}")
            return True
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
