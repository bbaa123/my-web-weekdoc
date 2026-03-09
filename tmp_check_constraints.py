import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    db_url = os.getenv("DATABASE_URL")
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    from sqlalchemy.pool import NullPool
    
    engine = create_async_engine(
        db_url,
        poolclass=NullPool,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        },
    )
    try:
        async with engine.connect() as conn:
            # Check constraints for 'notice' table
            res = await conn.execute(text("""
                SELECT conname, contype 
                FROM pg_constraint 
                WHERE conrelid = 'notice'::regclass
            """))
            print(f"--- NOTICE CONSTRAINTS ---")
            for r in res.fetchall():
                print(f"Name: {r[0]}, Type: {r[1]}")
                
            # Check constraints for 'users' table
            res = await conn.execute(text("""
                SELECT conname, contype 
                FROM pg_constraint 
                WHERE conrelid = 'users'::regclass
            """))
            print(f"\n--- USERS CONSTRAINTS ---")
            for r in res.fetchall():
                print(f"Name: {r[0]}, Type: {r[1]}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
