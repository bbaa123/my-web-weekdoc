import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_ports():
    db_pass = "rnjswjddk84"
    db_host = "aws-1-ap-northeast-2.pooler.supabase.com"
    db_user = "postgres.iqihwatbdqhbtonzfupc"
    db_name = "postgres"

    for port in [6543, 5432]:
        print(f"Testing port {port}...")
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    user=db_user,
                    password=db_pass,
                    host=db_host,
                    port=port,
                    database=db_name,
                    statement_cache_size=0,
                ),
                timeout=5.0
            )
            print(f"Port {port} CONNECTED")
            await conn.close()
        except Exception as e:
            print(f"Port {port} FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_ports())
