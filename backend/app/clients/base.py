"""Interfaces for text generation clients."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, AsyncIterator, Sequence


class LLMClient(ABC):
    """Abstract base class describing interactions with an LLM provider."""

    @abstractmethod
    async def generate(
        self,
        messages: Sequence[dict[str, str]],
        *,
        options: "LLMGenerationOptions | None" = None,
    ) -> "LLMGenerationResult":
        """Execute a chat completion request and return the aggregated result."""

    @abstractmethod
    async def stream(
        self,
        messages: Sequence[dict[str, str]],
        *,
        options: "LLMGenerationOptions | None" = None,
    ) -> AsyncIterator["LLMStreamChunk"]:
        """Execute a streaming request yielding incremental content."""


@dataclass(slots=True)
class LLMGenerationOptions:
    """Provider-agnostic parameters controlling generation behaviour."""

    model: str | None = None
    temperature: float | None = None


@dataclass(slots=True)
class LLMGenerationResult:
    """Aggregated result returned after a non-streaming generation call."""

    content: str
    model: str | None = None
    usage: dict[str, Any] | None = None
    raw: dict[str, Any] | None = None


@dataclass(slots=True)
class LLMStreamChunk:
    """Chunk of data emitted while streaming a completion."""

    type: str
    content: str | None = None
    usage: dict[str, Any] | None = None
    model: str | None = None
