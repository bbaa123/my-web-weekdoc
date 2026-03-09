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
    
    engine = create_async_engine(
        db_url,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        },
    )
    try:
        async with engine.connect() as conn:
            # Check tables
            res = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            tables = [r[0] for r in res]
            print(f"Tables: {tables}")
            
            # Check alembic version
            res = await conn.execute(text("SELECT version_num FROM alembic_version"))
            versions = [r[0] for r in res]
            print(f"Alembic Versions: {versions}")
            
            if 'notice' in tables:
                res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'notice'"))
                columns = [r[0] for r in res]
                print(f"Notice Columns: {columns}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
