"""Async client for interacting with OpenAI's Chat Completions API."""

from __future__ import annotations

from typing import Final

import httpx

from .base import LLMClient

OPENAI_CHAT_COMPLETIONS_URL: Final[str] = "https://api.openai.com/v1/chat/completions"


class OpenAIClient(LLMClient):
    """Minimal async OpenAI client suited for server-side prompt execution."""

    def __init__(self, api_key: str | None, model: str, timeout: int = 60) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout

    async def generate(self, prompt: str, context: str | None = None) -> str:
        """Call the OpenAI chat completions API and return the assistant reply."""
        if not self._api_key:
            msg = "OPENAI_API_KEY must be provided to use the OpenAI LLM client."
            raise ValueError(msg)

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                OPENAI_CHAT_COMPLETIONS_URL,
                headers=headers,
                json=payload,
            )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.json().get("error", {}).get("message", exc.response.text)
            msg = f"OpenAI request failed: {detail}"
            raise ValueError(msg) from exc

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            msg = "Unexpected OpenAI response structure."
            raise ValueError(msg) from exc
