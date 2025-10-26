"""ASR client (placeholder).

Reads audio bytes and returns a very simple transcript structure. In the
future this will call a real ASR provider configured via ASR_* settings.
"""

from __future__ import annotations

from typing import Any


class ASRClient:
    def __init__(self, base_url: str | None, api_key: str | None, model: str | None, timeout: int = 60) -> None:
        self._base_url = base_url
        self._api_key = api_key
        self._model = model
        self._timeout = timeout

    async def transcribe(self, *, file_bytes: bytes, filename: str) -> dict[str, Any]:
        # Placeholder: return a single-segment transcript to unblock pipeline
        return {
            "text": f"Transcription placeholder for {filename}",
            "segments": [
                {"start": 0.0, "end": 0.0, "text": f"Transcription placeholder for {filename}"}
            ],
        }


