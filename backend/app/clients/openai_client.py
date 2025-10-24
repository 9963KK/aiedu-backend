"""Async client for interacting with OpenAI's Chat Completions API."""

from __future__ import annotations

import json
from typing import AsyncIterator, Final, Sequence

import httpx

from .base import LLMClient, LLMGenerationOptions, LLMGenerationResult, LLMStreamChunk

OPENAI_CHAT_COMPLETIONS_URL: Final[str] = "https://api.openai.com/v1/chat/completions"


class OpenAIClient(LLMClient):
    """Minimal async OpenAI client suited for server-side prompt execution."""

    def __init__(self, api_key: str | None, model: str, timeout: int = 60) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout

    async def generate(
        self,
        messages: Sequence[dict[str, str]],
        *,
        options: LLMGenerationOptions | None = None,
    ) -> LLMGenerationResult:
        """Call the OpenAI chat completions API and return the assistant reply."""
        if not self._api_key:
            msg = "OPENAI_API_KEY must be provided to use the OpenAI LLM client."
            raise ValueError(msg)

        payload = self._build_payload(messages=messages, options=options)

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                OPENAI_CHAT_COMPLETIONS_URL,
                headers=self._build_headers(),
                json=payload,
            )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = _extract_error_detail(exc.response)
            msg = f"OpenAI request failed: {detail}"
            raise ValueError(msg) from exc

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            msg = "Unexpected OpenAI response structure."
            raise ValueError(msg) from exc

        return LLMGenerationResult(
            content=content,
            model=data.get("model"),
            usage=data.get("usage"),
            raw=data,
        )

    async def stream(
        self,
        messages: Sequence[dict[str, str]],
        *,
        options: LLMGenerationOptions | None = None,
    ) -> AsyncIterator[LLMStreamChunk]:
        """Streaming chat completions using OpenAI's streamed responses."""
        if not self._api_key:
            msg = "OPENAI_API_KEY must be provided to use the OpenAI LLM client."
            raise ValueError(msg)

        payload = self._build_payload(messages=messages, options=options)
        payload["stream"] = True

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            async with client.stream(
                "POST",
                OPENAI_CHAT_COMPLETIONS_URL,
                headers=self._build_headers(),
                json=payload,
            ) as response:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    detail = _extract_error_detail(exc.response)
                    msg = f"OpenAI streaming request failed: {detail}"
                    raise ValueError(msg) from exc

                end_emitted = False
                last_model: str | None = None

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    if line.startswith("data:"):
                        line = line[len("data:") :].strip()

                    if not line:
                        continue

                    if line == "[DONE]":
                        break

                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    last_model = chunk.get("model", last_model)

                    delta = (
                        chunk.get("choices", [{}])[0]
                        .get("delta", {})
                        .get("content")
                    )
                    if delta:
                        yield LLMStreamChunk(type="content", content=delta, model=last_model)

                    usage = chunk.get("usage")
                    if usage:
                        end_emitted = True
                        yield LLMStreamChunk(type="end", usage=usage, model=last_model)
                        break

                if not end_emitted:
                    yield LLMStreamChunk(type="end", model=last_model)

    def _build_payload(
        self,
        *,
        messages: Sequence[dict[str, str]],
        options: LLMGenerationOptions | None,
    ) -> dict[str, object]:
        model = options.model if options and options.model else self._model
        temperature = options.temperature if options and options.temperature is not None else 0.2
        return {
            "model": model,
            "messages": list(messages),
            "temperature": temperature,
        }

    def _build_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except json.JSONDecodeError:
        return response.text
    return payload.get("error", {}).get("message", response.text)
