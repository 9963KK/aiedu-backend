"""VQA client (routing-only placeholder).

Used to classify images into coarse categories to decide parsing path.
In future this will call a real VLM configured by VQA_* settings.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ImageCategory = Literal["text_heavy", "table", "diagram", "chart", "photo"]


@dataclass
class VQAClassifyResult:
    label: ImageCategory
    confidence: float


class VQAClient:
    def __init__(self, base_url: str | None, api_key: str | None, model: str | None, timeout: int = 30) -> None:
        self._base_url = base_url
        self._api_key = api_key
        self._model = model
        self._timeout = timeout

    async def classify(self, *, file_bytes: bytes, filename: str) -> VQAClassifyResult:
        # Placeholder rule: default to diagram with medium confidence.
        # Real implementation would call provider and inspect response.
        return VQAClassifyResult(label="diagram", confidence=0.55)


