"""VQA client (routing-only placeholder).

Used to classify images into coarse categories to decide parsing path.
In future this will call a real VLM configured by VQA_* settings.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
import json
import httpx

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
        """Call an OpenAI-compatible /chat/completions endpoint to classify image.

        若未配置 VQA_*，退化为 diagram。
        """
        if not (self._base_url and self._model and self._api_key):
            return VQAClassifyResult(label="diagram", confidence=0.55)

        headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
        # 将图片转成 data url 发送（简单占位；真实环境可用文件上传后引用 URL）
        import base64

        b64 = base64.b64encode(file_bytes).decode("ascii")
        data_url = f"data:image/{filename.split('.')[-1]};base64,{b64}"

        system_prompt = (
            "对输入图片进行类型分类：text_heavy/table/diagram/chart/photo。仅输出 JSON："
            "{\"label\":\"...\",\"confidence\":0.0}"
        )
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "请分类"},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            "temperature": 0,
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(f"{self._base_url.rstrip('/')}/chat/completions", headers=headers, json=payload)
            try:
                resp.raise_for_status()
            except httpx.HTTPStatusError:
                return VQAClassifyResult(label="diagram", confidence=0.51)
            data = resp.json()
            try:
                content = data["choices"][0]["message"]["content"]
                obj = json.loads(content)
                label = obj.get("label", "diagram")
                conf = float(obj.get("confidence", 0.5))
                return VQAClassifyResult(label=label, confidence=conf)
            except Exception:
                return VQAClassifyResult(label="diagram", confidence=0.52)


