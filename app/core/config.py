"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration sourced via environment variables and .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = Field(default="AIEDU Backend", alias="APP_NAME")
    debug: bool = Field(default=False, alias="APP_DEBUG")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    llm_provider: str = Field(default="openai", alias="LLM_PROVIDER")
    model_name: str = Field(default="gpt-4o-mini", alias="MODEL_NAME")
    request_timeout_seconds: int = Field(default=60, alias="REQUEST_TIMEOUT_SECONDS")


@lru_cache
def get_settings() -> Settings:
    """Provide a cached settings instance for dependency injection."""
    return Settings()


settings = get_settings()
