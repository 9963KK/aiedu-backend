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
    session_id: str | None = Field(default=None, alias="sessionId")
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
    session_id: str | None = None
    history: list[dict[str, str]] = []

    if ctype.startswith("multipart/"):
        form = await request.form()
        message = str(form.get("message") or "")
        files = form.getlist("file") if hasattr(form, "getlist") else []
        file_count = len(files)
        # optional: hints JSON (may contain previousMessages / sessionId)
        hints_raw = form.get("hints")
        if hints_raw:
            try:
                hints_obj = json.loads(str(hints_raw))
                if isinstance(hints_obj, dict):
                    pm = hints_obj.get("previousMessages")
                    if isinstance(pm, list):
                        history = [
                            {"role": str(i.get("role")), "content": str(i.get("content", ""))}
                            for i in pm
                            if isinstance(i, dict) and i.get("role") and i.get("content")
                        ]
                    sid = hints_obj.get("sessionId")
                    if isinstance(sid, str) and sid:
                        session_id = sid
            except Exception:  # noqa: BLE001
                pass
    else:
        try:
            data = await request.json()
        except Exception as exc:  # noqa: BLE001
            # 如果前端错误地以 JSON 头发送了空体,返回更友好的信息
            raise HTTPException(status_code=400, detail="Invalid JSON body: empty or malformed") from exc
        payload = InstantJson.model_validate(data)
        message = payload.message
        material_ids = payload.material_ids
        session_id = payload.session_id
        if payload.hints and isinstance(payload.hints, dict):
            pm = payload.hints.get("previousMessages")
            if isinstance(pm, list):
                history = [
                    {"role": str(i.get("role")), "content": str(i.get("content", ""))}
                    for i in pm
                    if isinstance(i, dict) and i.get("role") and i.get("content")
                ]

    async def stream() -> Any:
        # 将旧版 /llm/messages/stream 的核心逻辑迁移到此：
        # 1) 发送 start
        # 2) 逐个 token 下发
        # 3) 结束事件 end
        message_id = "msg_stub"
        start_payload = {"type": "start", "messageId": message_id}
        if session_id:
            start_payload["sessionId"] = session_id
        yield _format_sse(start_payload)

        if not message:
            yield _format_sse({"type": "error", "message": "message 不能为空"})
            return

        # 目前忽略上传的文件/材料 ID；先基于历史上下文 + 本轮问题进行文本回答，后续接入 VLM。
        messages = []
        if history:
            # 截断最后 10 条以控制长度
            history_tail = history[-10:]
            for h in history_tail:
                role = h.get("role")
                content = h.get("content")
                if role in {"system", "user", "assistant"} and isinstance(content, str):
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        try:
            got_any_token = False
            async for chunk in llm_service.stream_completion(messages=messages):
                if chunk.type == "content" and chunk.content:
                    got_any_token = True
                    yield _format_sse({"type": "token", "content": chunk.content})
                elif chunk.type == "end":
                    # 若未收到任何 token，降级为非流式补发一次完整回答
                    if not got_any_token:
                        try:
                            result = await llm_service.generate_completion(messages=messages)
                            if result.content:
                                yield _format_sse({"type": "token", "content": result.content})
                        except ValueError as exc:
                            yield _format_sse({"type": "error", "message": str(exc)})
                            break
                    event_payload: dict[str, Any] = {"type": "end", "messageId": message_id}
                    if chunk.model:
                        event_payload["model"] = chunk.model
                    yield _format_sse(event_payload)
                    break
        except ValueError as exc:
            yield _format_sse({"type": "error", "message": str(exc)})

    # 明确 SSE 推荐响应头
    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 兼容某些代理禁用缓冲
        },
    )


@router.post("/knowledge")
async def qa_knowledge() -> dict[str, Any]:
    """Knowledge-base Q&A (not implemented)."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Knowledge QA not implemented yet")


