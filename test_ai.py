import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # Get token. I will first query reports, and pick the first one's id
        res = await client.post('http://localhost:8000/api/v1/login-auth/login', json={"id": "cjhol2107", "password": "password"})
        if res.status_code != 200:
            res = await client.post('http://localhost:8000/api/v1/auth/login', json={"email": "cjhol2107@vntgcorp.com", "password": "password"})
        if res.status_code != 200:
            print("Login failed:", res.text)
            return
        token = res.json().get("access_token")
        
        # Get team reports
        res = await client.get('http://localhost:8000/api/v1/weekly-reports/team', headers={"Authorization": f"Bearer {token}"})
        reports = res.json()
        if not reports:
            print("No reports found")
            return
        first_report_id = reports[0]["weekly_reports_no"]
        
        # Summarize
        res_summary = await client.post(f'http://localhost:8000/api/v1/weekly-reports/{first_report_id}/ai/summarize', headers={"Authorization": f"Bearer {token}"})
        print(res_summary.status_code)
        print(res_summary.text)

asyncio.run(main())
