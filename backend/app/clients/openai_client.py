"""Async client for interacting with OpenAI-compatible Chat Completions API.

This client targets the OpenAI Chat Completions schema and also works with
compatible providers when a custom base URL is provided (e.g. self-hosted gateways).
"""

from __future__ import annotations

import json
from typing import AsyncIterator, Final, Sequence

import httpx

from .base import LLMClient, LLMGenerationOptions, LLMGenerationResult, LLMStreamChunk

DEFAULT_OPENAI_BASE_URL: Final[str] = "https://api.openai.com/v1"


class OpenAIClient(LLMClient):
    """Minimal async OpenAI-compatible client for server-side prompt execution."""

    def __init__(self, api_key: str | None, model: str, base_url: str = DEFAULT_OPENAI_BASE_URL, timeout: int = 60) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = base_url
        self._timeout = timeout

    async def generate(
        self,
        messages: Sequence[dict[str, str]],
        *,
        options: LLMGenerationOptions | None = None,
    ) -> LLMGenerationResult:
        """Call the OpenAI chat completions API and return the assistant reply."""
        if not self._api_key:
            msg = "LLM API key must be provided (VLM_APIKEY)."
            raise ValueError(msg)

        payload = self._build_payload(messages=messages, options=options)

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                self._completions_url,
                headers=self._build_headers(),
                json=payload,
            )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = _extract_error_detail(exc.response)
            msg = f"OpenAI request failed: {detail}"
            raise ValueError(msg) from exc

        try:
            data = response.json()
        except json.JSONDecodeError as exc:  # provider returned non‑JSON or empty body
            preview = response.text[:200] if response.text else ""
            msg = (
                "Provider returned a non-JSON response for non-streaming request. "
                "Please verify VLM_BASEURL/VLM_MODEL. Response preview: " + preview
            )
            raise ValueError(msg) from exc
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
            msg = "LLM API key must be provided (VLM_APIKEY)."
            raise ValueError(msg)

        payload = self._build_payload(messages=messages, options=options)
        payload["stream"] = True

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            async with client.stream(
                "POST",
                self._completions_url,
                headers=self._build_headers(),
                json=payload,
            ) as response:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    # 对于 streaming 响应,需要先读取 body 再解析错误信息
                    try:
                        await exc.response.aread()
                    except Exception:
                        pass
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

                    # choices 可能为空数组（部分网关会发送空心跳），要做健壮性判断
                    choices = chunk.get("choices")
                    if isinstance(choices, list) and choices:
                        choice0 = choices[0] or {}
                        delta_obj = choice0.get("delta") or {}
                        content_piece = delta_obj.get("content")
                        if content_piece:
                            yield LLMStreamChunk(type="content", content=content_piece, model=last_model)

                        # 某些实现不会返回 usage，而是只给 finish_reason
                        finish = choice0.get("finish_reason")
                        if finish in {"stop", "length", "content_filter"}:
                            end_emitted = True
                            yield LLMStreamChunk(type="end", model=last_model)
                            break

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

    @property
    def _completions_url(self) -> str:
        base = self._base_url.rstrip("/")
        return f"{base}/chat/completions"


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except json.JSONDecodeError:
        return response.text
    return payload.get("error", {}).get("message", response.text)
