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
    
    # Use poolclass=NullPool to avoid any pool-related prepared statement issues
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
            # Check tables
            res = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            tables = [r[0] for r in res.fetchall()]
            print(f"--- TABLES ---")
            for t in tables:
                print(t)
            
            # Check alembic version
            print(f"\n--- ALEMBIC VERSION ---")
            try:
                res = await conn.execute(text("SELECT version_num FROM alembic_version"))
                versions = [r[0] for r in res.fetchall()]
                print(versions)
            except Exception as e:
                print(f"Error reading alembic_version: {e}")
            
            if 'notice' in tables:
                print(f"\n--- NOTICE COLUMNS ---")
                res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notice'"))
                for r in res.fetchall():
                    print(f"{r[0]}: {r[1]}")
                
    except Exception as e:
        print(f"Error during execution: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
