"""Endpoints managing interactions with large language models (LLMs)."""

from __future__ import annotations

import json
from typing import Any, AsyncIterator, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from ...services.llm_service import LLMService, get_llm_service


def _to_camel(value: str) -> str:
    first, *others = value.split("_")
    return first + "".join(word.capitalize() for word in others)


class CamelModel(BaseModel):
    """Base model that serialises field names using camelCase."""

    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)


class ChatMessage(CamelModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatContext(CamelModel):
    previous_messages: list[ChatMessage] = Field(default_factory=list)
    metadata: dict[str, Any] | None = None


class GenerationOptions(CamelModel):
    model: str | None = None
    temperature: float | None = None


class LLMMessageRequest(CamelModel):
    message: str
    course_id: str | None = None
    session_id: str | None = None
    context: ChatContext | None = None
    options: GenerationOptions | None = None


class TokensUsed(CamelModel):
    prompt: int | None = None
    completion: int | None = None
    total: int | None = None


class LLMMessageResponse(CamelModel):
    session_id: str
    message_id: str
    content: str
    tokens_used: TokensUsed | None = None
    metadata: dict[str, Any] | None = None


class PromptRequest(CamelModel):
    prompt: str = Field(..., description="User prompt or instruction to send to the LLM.")
    context: str | None = Field(
        default=None,
        description="Optional additional context for grounding the prompt.",
    )


class PromptResponse(CamelModel):
    response: str = Field(..., description="Generated text returned by the LLM.")


router = APIRouter(prefix="/llm", tags=["llm"])


@router.post(
    "/messages",
    response_model=LLMMessageResponse,
    summary="生成非流式 LLM 回复",
)
async def generate_message(
    payload: LLMMessageRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> LLMMessageResponse:
    session_id = payload.session_id or str(uuid4())
    message_id = str(uuid4())

    try:
        messages = _build_messages(payload)
        options = payload.options or GenerationOptions()
        result = await llm_service.generate_completion(
            messages=messages,
            model=options.model,
            temperature=options.temperature,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    tokens_used = None
    if result.usage:
        tokens_used = TokensUsed(
            prompt=result.usage.get("prompt_tokens"),
            completion=result.usage.get("completion_tokens"),
            total=result.usage.get("total_tokens"),
        )

    metadata = {
        "provider": llm_service.provider,
        "model": result.model or (payload.options.model if payload.options else None) or settings.model_name,
    }

    return LLMMessageResponse(
        session_id=session_id,
        message_id=message_id,
        content=result.content,
        tokens_used=tokens_used,
        metadata=metadata,
    )


@router.post(
    "/messages/stream",
    summary="流式生成 LLM 回复（SSE）",
)
async def stream_message(
    payload: LLMMessageRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> StreamingResponse:
    session_id = payload.session_id or str(uuid4())
    message_id = str(uuid4())
    options = payload.options or GenerationOptions()

    async def event_publisher() -> AsyncIterator[str]:
        yield _format_sse({"type": "start", "sessionId": session_id, "messageId": message_id})
        try:
            messages = _build_messages(payload)
            async for chunk in llm_service.stream_completion(
                messages=messages,
                model=options.model,
                temperature=options.temperature,
            ):
                if chunk.type == "content" and chunk.content:
                    yield _format_sse({"type": "token", "content": chunk.content})
                elif chunk.type == "end":
                    total_tokens = chunk.usage.get("total_tokens") if chunk.usage else None
                    event_payload = {
                        "type": "end",
                        "messageId": message_id,
                        "totalTokens": total_tokens,
                    }
                    if chunk.model:
                        event_payload["model"] = chunk.model
                    yield _format_sse(event_payload)
                    break
        except ValueError as exc:
            yield _format_sse({"type": "error", "message": str(exc)})

    return StreamingResponse(
        event_publisher(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post(
    "/prompt",
    response_model=PromptResponse,
    summary="Execute prompt against the configured LLM provider.",
)
async def run_prompt(
    payload: PromptRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> PromptResponse:
    try:
        reply = await llm_service.generate_response(prompt=payload.prompt, context=payload.context)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return PromptResponse(response=reply)


def _build_messages(payload: LLMMessageRequest) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []

    if payload.context and payload.context.metadata:
        system_prompt = payload.context.metadata.get("systemPrompt")
        if system_prompt:
            messages.append({"role": "system", "content": str(system_prompt)})

    if payload.context:
        for item in payload.context.previous_messages:
            messages.append({"role": item.role, "content": item.content})

    messages.append({"role": "user", "content": payload.message})
    return messages


def _format_sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
