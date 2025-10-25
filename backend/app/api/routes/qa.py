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

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


router = APIRouter(prefix="/qa", tags=["qa"])


class InstantJson(BaseModel):
    message: str
    material_ids: list[str] | None = Field(default=None, alias="materialIds")
    hints: dict[str, Any] | None = None


def _format_sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/instant")
async def qa_instant(request: Request) -> StreamingResponse:
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
        yield _format_sse({"type": "start", "messageId": "msg_stub"})
        intro = "已收到文件上传" if file_count else "使用已上传材料" if material_ids else "纯文本提问"
        info_parts: list[str] = []
        if file_count:
            info_parts.append(f"文件数: {file_count}")
        if material_ids:
            info_parts.append(f"材料ID: {len(material_ids)} 个")
        if info_parts:
            yield _format_sse({"type": "token", "content": f"{intro}（" + "，".join(info_parts) + "）。"})
        yield _format_sse({"type": "token", "content": f"问题：{message}\n"})
        # placeholder conclusion
        yield _format_sse({"type": "token", "content": "（VLM 接入后将在此处返回多模态解析结果。）"})
        yield _format_sse({"type": "end", "messageId": "msg_stub"})

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.post("/knowledge")
async def qa_knowledge() -> dict[str, Any]:
    """Knowledge-base Q&A (not implemented)."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Knowledge QA not implemented yet")


