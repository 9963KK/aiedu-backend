"""Question answering endpoints.

This module provides two interfaces:
 - /qa/instant: multimodal instant Q&A using a VLM (placeholder streaming)
 - /qa/knowledge: knowledge-base enhanced Q&A (returns 501 for now)

The instant endpoint accepts either multipart/form-data (message + file[])
or JSON (message + materialIds). We do not persist files here; this is a
lightweight bridge to the VLM and streams a placeholder response so the
frontend integration can proceed while the VLM client is wired later.
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.llm_service import LLMService, get_llm_service


router = APIRouter(prefix="/qa", tags=["qa"])


class InstantJson(BaseModel):
    message: str
    material_ids: list[str] | None = Field(default=None, alias="materialIds")
    hints: dict[str, Any] | None = None


def _format_sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/instant")
async def qa_instant(request: Request, llm_service: LLMService = Depends(get_llm_service)) -> StreamingResponse:
    """Multimodal instant Q&A (placeholder streaming).

    Accepts either multipart/form-data or application/json:
      - multipart: fields: message (str), file (0..n), hints (json string)
      - json: { message, materialIds?, hints? }
    """

    ctype = request.headers.get("content-type", "").lower()
    message: str
    file_count = 0
    material_ids: list[str] | None = None

    if ctype.startswith("multipart/"):
        form = await request.form()
        message = str(form.get("message") or "")
        files = form.getlist("file") if hasattr(form, "getlist") else []
        file_count = len(files)
        # hints are optional and ignored here
    else:
        try:
            data = await request.json()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail="Invalid request body") from exc
        payload = InstantJson.model_validate(data)
        message = payload.message
        material_ids = payload.material_ids

    async def stream() -> Any:
        # 将旧版 /llm/messages/stream 的核心逻辑迁移到此：
        # 1) 发送 start
        # 2) 逐个 token 下发
        # 3) 结束事件 end
        message_id = "msg_stub"
        yield _format_sse({"type": "start", "messageId": message_id})

        if not message:
            yield _format_sse({"type": "error", "message": "message 不能为空"})
            return

        # 目前忽略上传的文件/材料 ID，仅以文本对话回答；后续接入 VLM 解析。
        messages = [{"role": "user", "content": message}]

        try:
            async for chunk in llm_service.stream_completion(messages=messages):
                if chunk.type == "content" and chunk.content:
                    yield _format_sse({"type": "token", "content": chunk.content})
                elif chunk.type == "end":
                    event_payload: dict[str, Any] = {"type": "end", "messageId": message_id}
                    if chunk.model:
                        event_payload["model"] = chunk.model
                    yield _format_sse(event_payload)
                    break
        except ValueError as exc:
            yield _format_sse({"type": "error", "message": str(exc)})

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.post("/knowledge")
async def qa_knowledge() -> dict[str, Any]:
    """Knowledge-base Q&A (not implemented)."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Knowledge QA not implemented yet")


