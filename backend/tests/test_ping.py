import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_ping_endpoint_returns_pong() -> None:
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        response = await client.get("/api/test/ping")

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "pong"
    assert payload["app_name"]
    assert "server_time" in payload
