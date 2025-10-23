"""Liveness and readiness probes."""

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", summary="Health check")
async def health() -> dict[str, str]:
    """Return a basic health payload for monitoring."""
    return {"status": "ok"}
