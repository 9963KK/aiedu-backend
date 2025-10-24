"""Service layer handling orchestration around LLM provider clients."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import AsyncIterator, Sequence

from app.clients.base import (
    LLMClient,
    LLMGenerationOptions,
    LLMGenerationResult,
    LLMStreamChunk,
)
from app.clients.openai_client import OpenAIClient
from app.core.config import settings


class LLMService:
    """High-level abstraction that other layers use to interact with LLMs."""

    def __init__(self, client: LLMClient) -> None:
        self._client = client
        self._provider = settings.text_provider

    @property
    def provider(self) -> str:
        """Name of the configured LLM provider."""
        return self._provider

    async def generate_completion(
        self,
        messages: Sequence[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float | None = None,
    ) -> LLMGenerationResult:
        """Execute a non-streaming completion and aggregate the result."""
        options = LLMGenerationOptions(model=model, temperature=temperature)
        return await self._client.generate(messages=messages, options=options)

    async def stream_completion(
        self,
        messages: Sequence[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float | None = None,
    ) -> AsyncIterator[LLMStreamChunk]:
        """Yield streaming chunks for the provided chat messages."""
        options = LLMGenerationOptions(model=model, temperature=temperature)
        async for chunk in self._client.stream(messages=messages, options=options):
            yield chunk

    async def generate_response(self, prompt: str, context: str | None = None) -> str:
        """Compatibility helper mirroring the legacy prompt endpoint."""
        messages: list[dict[str, str]] = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})
        result = await self.generate_completion(messages=messages)
        return result.content


def _build_client() -> LLMClient:
    """Build an OpenAI-compatible client using TXT_* settings.

    Many providers (including siliconflow, etc.) expose an OpenAI-compatible
    Chat Completions API. We rely on TXT_BASEURL/TXT_APIKEY/TXT_MODEL to
    connect, without restricting the provider name.
    """
    return OpenAIClient(
        api_key=settings.text_api_key,
        model=settings.text_model,
        base_url=settings.text_base_url,
        timeout=settings.request_timeout_seconds,
    )


@lru_cache
def get_llm_service() -> LLMService:
    """FastAPI dependency that caches the service instance."""
    return LLMService(client=_build_client())
