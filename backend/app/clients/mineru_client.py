"""MinerU client (placeholder) for document and image parsing.

This wraps MinerU HTTP endpoints to extract structured text/tables
from PDFs, PPT/Word and images. We intentionally keep the interface
minimal for the MVP and avoid vendor lock-in.
"""

from __future__ import annotations

from typing import Any, Literal

import httpx


class MinerUClient:
    def __init__(self, base_url: str, api_key: str | None, timeout: int = 60) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout

    async def parse_document(self, *, file_bytes: bytes, filename: str, doc_type: Literal["pdf", "ppt", "pptx", "doc", "docx"]) -> dict[str, Any]:
        """Send a document to MinerU for parsing.

        Returns a provider-normalised dict with keys like pages/tables.
        Exact mapping depends on MinerU's response schema.
        """
        headers = {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}
        files = {"file": (filename, file_bytes)}

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                # 假定 MinerU 文档解析同步端点：/api/parse/{doc_type}
                resp = await client.post(f"{self._base_url}/api/parse/{doc_type}", headers=headers, files=files)
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPStatusError as exc:
            detail = await _safe_error_text(exc.response)
            raise ValueError(f"MinerU document parse failed: {detail}") from exc

    async def parse_image(self, *, file_bytes: bytes, filename: str) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}
        files = {"file": (filename, file_bytes)}

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                # 假定 MinerU 图片解析同步端点：/api/parse/image
                resp = await client.post(f"{self._base_url}/api/parse/image", headers=headers, files=files)
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPStatusError as exc:
            detail = await _safe_error_text(exc.response)
            raise ValueError(f"MinerU image parse failed: {detail}") from exc


async def _safe_error_text(resp: httpx.Response) -> str:
    try:
        await resp.aread()
    except Exception:
        pass
    try:
        return resp.json()
    except Exception:
        return resp.text


