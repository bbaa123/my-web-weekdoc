import asyncio
import asyncpg

async def test_raw_asyncpg():
    db_url = "postgresql://postgres.iqihwatbdqhbtonzfupc:rnjswjddk84@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
    print(f"Testing connection to: {db_url}")
    
    try:
        # statement_cache_size=0 is the key for pgbouncer
        conn = await asyncpg.connect(db_url, statement_cache_size=0)
        print("Raw asyncpg: Successfully connected to the database!")
        val = await conn.fetchval("SELECT 1")
        print(f"Result: {val}")
        await conn.close()
        return True
    except Exception as e:
        print(f"Raw asyncpg: Failed to connect: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_raw_asyncpg())
