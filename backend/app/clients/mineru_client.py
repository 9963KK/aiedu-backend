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

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            # NOTE: endpoint path should be aligned with the MinerU docs.
            # Using a generic placeholder path here; will update when wiring real API.
            resp = await client.post(f"{self._base_url}/parse/{doc_type}", headers=headers, files=files)
            resp.raise_for_status()
            return resp.json()

    async def parse_image(self, *, file_bytes: bytes, filename: str) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}
        files = {"file": (filename, file_bytes)}

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(f"{self._base_url}/parse/image", headers=headers, files=files)
            resp.raise_for_status()
            return resp.json()


