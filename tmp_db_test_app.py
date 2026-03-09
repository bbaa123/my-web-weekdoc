import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_app_engine():
    db_url = "postgresql+asyncpg://postgres.iqihwatbdqhbtonzfupc:rnjswjddk84@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
    engine = create_async_engine(
        db_url,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        },
    )
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"App Engine connection successful: {result.fetchone()}")
            return True
    except Exception as e:
        print(f"App Engine connection failed: {e}")
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_app_engine())
