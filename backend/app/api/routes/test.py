"""Auxiliary endpoints used during development and integration testing."""

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/test", tags=["test"])


class PingResponse(BaseModel):
    """Payload returned by the /test/ping endpoint."""

    message: str
    app_name: str
    server_time: datetime


@router.get(
    "/ping",
    response_model=PingResponse,
    summary="Connectivity test endpoint",
)
async def ping() -> PingResponse:
    """Return a simple payload so clients can verify the backend is reachable."""
    return PingResponse(
        message="pong",
        app_name=settings.app_name,
        server_time=datetime.now(timezone.utc),
    )
