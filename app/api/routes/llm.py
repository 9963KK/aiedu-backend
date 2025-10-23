"""Endpoints managing interactions with large language models (LLMs)."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ...services.llm_service import LLMService, get_llm_service


class PromptRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or instruction to send to the LLM.")
    context: str | None = Field(
        default=None,
        description="Optional additional context for grounding the prompt.",
    )


class PromptResponse(BaseModel):
    response: str = Field(..., description="Generated text returned by the LLM.")


router = APIRouter(prefix="/llm", tags=["llm"])


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
