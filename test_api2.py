import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # Get token
        res = await client.post('http://localhost:8000/api/v1/login-auth/login', json={"id": "cjhol2107", "password": "password"})
        if res.status_code != 200:
            print("Login failed:", res.text)
            return
        token = res.json().get("access_token")
        
        # Get team reports
        res = await client.get('http://localhost:8000/api/v1/weekly-reports/team', headers={"Authorization": f"Bearer {token}"})
        print(res.status_code)
        print(res.text)

asyncio.run(main())
