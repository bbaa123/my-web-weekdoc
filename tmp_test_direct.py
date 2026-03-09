import asyncio
import asyncpg
import os

async def test_direct():
    db_pass = "rnjswjddk84"
    db_host = "db.iqihwatbdqhbtonzfupc.supabase.co"
    db_user = "postgres"
    db_name = "postgres"

    print(f"Testing direct connection to {db_host}:5432...")
    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(
                user=db_user,
                password=db_pass,
                host=db_host,
                port=5432,
                database=db_name,
            ),
            timeout=10.0
        )
        print(f"Direct connection SUCCESS")
        await conn.close()
    except Exception as e:
        print(f"Direct connection FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_direct())
