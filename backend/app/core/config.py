"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration sourced via environment variables and .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = Field(default="AIEDU Backend", alias="APP_NAME")
    debug: bool = Field(default=False, alias="APP_DEBUG")

    # Text modality variables (required going forward)
    txt_provider: str | None = Field(default=None, alias="TXT_PROVIDER")
    txt_base_url: str | None = Field(default=None, alias="TXT_BASEURL")
    txt_model: str | None = Field(default=None, alias="TXT_MODEL")
    txt_api_key: str | None = Field(default=None, alias="TXT_APIKEY")
    request_timeout_seconds: int = Field(default=60, alias="REQUEST_TIMEOUT_SECONDS")

    # ---- Derived accessors (TXT_* only) ----
    @property
    def text_provider(self) -> str:
        provider = (self.txt_provider or "openai").lower()
        return provider

    @property
    def text_base_url(self) -> str:
        return self.txt_base_url or "https://api.openai.com/v1"

    @property
    def text_model(self) -> str:
        return self.txt_model or "gpt-4o-mini"

    @property
    def text_api_key(self) -> str | None:
        return self.txt_api_key


@lru_cache
def get_settings() -> Settings:
    """Provide a cached settings instance for dependency injection."""
    return Settings()


settings = get_settings()
