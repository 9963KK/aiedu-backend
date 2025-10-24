"""ASGI entrypoint for the FastAPI application."""

from fastapi import FastAPI

from app.api.routes import health, llm, test
from app.core.config import settings


def create_app() -> FastAPI:
    """Application factory used by ASGI servers and tests."""
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(llm.router, prefix="/api")
    app.include_router(test.router, prefix="/api")
    return app


app = create_app()
