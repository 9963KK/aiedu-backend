"""Service layer handling orchestration around LLM provider clients."""

from functools import lru_cache

from app.clients.base import LLMClient
from app.clients.openai_client import OpenAIClient
from app.core.config import settings


class LLMService:
    """High-level abstraction that other layers use to interact with LLMs."""

    def __init__(self, client: LLMClient) -> None:
        self._client = client

    async def generate_response(self, prompt: str, context: str | None = None) -> str:
        """Send a prompt to the underlying LLM client and return the generated text."""
        return await self._client.generate(prompt=prompt, context=context)


def _build_client() -> LLMClient:
    """Factory returning the correct LLM client based on settings."""
    provider = settings.llm_provider.lower()
    if provider == "openai":
        return OpenAIClient(
            api_key=settings.openai_api_key,
            model=settings.model_name,
            timeout=settings.request_timeout_seconds,
        )
    msg = f"Unsupported LLM provider '{settings.llm_provider}'."
    raise ValueError(msg)


@lru_cache
def get_llm_service() -> LLMService:
    """FastAPI dependency that caches the service instance."""
    return LLMService(client=_build_client())
