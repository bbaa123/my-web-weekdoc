
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import inspect
from dotenv import load_dotenv

load_dotenv()

async def check_tables():
    url = os.getenv("DATABASE_URL")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        def get_tables(sync_conn):
            inspector = inspect(sync_conn)
            return inspector.get_table_names()
        
        tables = await conn.run_sync(get_tables)
        print(f"Tables in database: {tables}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_tables())
