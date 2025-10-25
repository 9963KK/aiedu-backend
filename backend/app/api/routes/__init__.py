"""Route modules for the FastAPI application."""

# Re-export for convenient import in app.main
from . import health, llm, materials, test, qa  # noqa: F401
