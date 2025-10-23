"""Interfaces for text generation clients."""

from abc import ABC, abstractmethod


class LLMClient(ABC):
    """Abstract base class describing interactions with an LLM provider."""

    @abstractmethod
    async def generate(self, prompt: str, context: str | None = None) -> str:
        """Execute a prompt and return generated text."""
        raise NotImplementedError
