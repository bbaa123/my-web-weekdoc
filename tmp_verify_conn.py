import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

async def verify_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    print(f"Testing connection to: {db_url.split('@')[-1]}") # Print host only for security
    
    engine = create_async_engine(
        db_url,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        },
    )
    
    try:
        async with engine.connect() as conn:
            # 1. Simple query
            result = await conn.execute(text("SELECT 1"))
            print(f"Basic connection test: SUCCESS (Result: {result.fetchone()[0]})")
            
            # 2. Check current alembic version
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.fetchone()
            print(f"Alembic version in DB: {version[0] if version else 'None'}")
            
            # 3. Check table list
            result = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"Tables found in DB: {', '.join(tables)}")
            
            return True
    except Exception as e:
        print(f"Database connection test: FAILED")
        print(f"Error details: {e}")
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_db_connection())
