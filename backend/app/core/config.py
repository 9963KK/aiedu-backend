"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration sourced via environment variables and .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

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

    # ---- Materials / Multimodal ingest settings ----
    storage_tmp_dir: str = Field(default="/tmp/aiedu_uploads", alias="STORAGE_TMP_DIR")
    upload_max_mb: int = Field(default=200, alias="UPLOAD_MAX_MB")
    video_max_mb: int = Field(default=500, alias="VIDEO_MAX_MB")
    audio_max_minutes: int = Field(default=120, alias="AUDIO_MAX_MINUTES")

    # MinerU configuration (document/image parsing)
    mineru_base_url: str | None = Field(default=None, alias="MINERU_BASEURL")
    mineru_api_key: str | None = Field(
        default=None,
        alias="MINERU_APIKEY",
        validation_alias=AliasChoices("MINERU_APIKEY", "MINERU_TOKEN"),
    )

    # Vision model for PDF/PPT/Image parsing (placeholder configuration)
    vqa_provider: str | None = Field(default=None, alias="VQA_PROVIDER")
    vqa_base_url: str | None = Field(default=None, alias="VQA_BASEURL")
    vqa_model: str | None = Field(default=None, alias="VQA_MODEL")
    vqa_api_key: str | None = Field(default=None, alias="VQA_APIKEY")

    # ASR model for audio/video transcription (placeholder configuration)
    asr_provider: str | None = Field(default=None, alias="ASR_PROVIDER")
    asr_base_url: str | None = Field(default=None, alias="ASR_BASEURL")
    asr_model: str | None = Field(default=None, alias="ASR_MODEL")
    asr_api_key: str | None = Field(default=None, alias="ASR_APIKEY")
    asr_language: str | None = Field(default="auto", alias="ASR_LANGUAGE")

    # Embeddings (vector) model configuration - placeholder for retrieval
    emb_provider: str | None = Field(default=None, alias="EMB_PROVIDER")
    emb_base_url: str | None = Field(default=None, alias="EMB_BASEURL")
    emb_model: str | None = Field(default=None, alias="EMB_MODEL")
    emb_api_key: str | None = Field(default=None, alias="EMB_APIKEY")
    emb_dim: int | None = Field(default=None, alias="EMB_DIM")
    emb_pooling: str | None = Field(default=None, alias="EMB_POOLING")
    emb_batch: int | None = Field(default=64, alias="EMB_BATCH")


@lru_cache
def get_settings() -> Settings:
    """Provide a cached settings instance for dependency injection."""
    return Settings()


settings = get_settings()
