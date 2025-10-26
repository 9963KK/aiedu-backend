"""Parse orchestrator for multimodal materials (MVP).

Rules confirmed by user:
- PDF/PPT/Word -> MinerU only (no local OCR)
- Image -> route by vision; text-heavy/table may go to MinerU, otherwise keep as caption/summary
- Audio -> ASR (already configured elsewhere) [placeholder hook]
- Video -> not processed in this phase

The orchestrator will be wired into materials routes later.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.clients.mineru_client import MinerUClient
from app.clients.asr_client import ASRClient
from app.clients.vqa_client import VQAClient
from app.core.config import settings


class ParseService:
    def __init__(self) -> None:
        self.tmp_base = Path(settings.storage_tmp_dir)
        self.mineru = MinerUClient(
            base_url=(settings.mineru_base_url or "https://mineru.net"),
            api_key=settings.mineru_api_key,
            timeout=settings.request_timeout_seconds,
        )
        self.asr = ASRClient(
            base_url=settings.asr_base_url,
            api_key=settings.asr_api_key,
            model=settings.asr_model,
            timeout=settings.request_timeout_seconds,
        )
        self.vqa = VQAClient(
            base_url=settings.vqa_base_url,
            api_key=settings.vqa_api_key,
            model=settings.vqa_model,
            timeout=settings.request_timeout_seconds,
        )

    def _material_dir(self, material_id: str) -> Path:
        return self.tmp_base / material_id

    async def parse_document_via_mineru(self, material_id: str, filename: str) -> dict[str, Any]:
        """Call MinerU for document parsing and persist chunks/markdown.

        Returns a small status dict.
        """
        mdir = self._material_dir(material_id)
        mdir.mkdir(parents=True, exist_ok=True)
        src = next(mdir.glob("*")) if not (mdir / filename).exists() else (mdir / filename)
        if not src or not src.exists():
            raise FileNotFoundError("material file not found")

        suffix = src.suffix.lower().lstrip(".")
        doc_type = "pdf" if suffix in {"pdf"} else suffix
        try:
            data = await self.mineru.parse_document(
                file_bytes=src.read_bytes(), filename=src.name, doc_type=doc_type  # type: ignore[arg-type]
            )
        except Exception as exc:
            (mdir / "status.txt").write_text("failed", encoding="utf-8")
            (mdir / "last_error.json").write_text(json.dumps({"stage": "mineru_document", "error": str(exc)}), encoding="utf-8")
            raise

        # Normalise to markdown + chunks (very light placeholder)
        markdown_lines: list[str] = []
        chunks: list[dict[str, Any]] = []
        pages = data.get("pages") or []
        for idx, page in enumerate(pages, start=1):
            text = page.get("text") or ""
            if text:
                markdown_lines.append(f"\n\n## Page {idx}\n\n{text}")
                chunks.append({"id": f"p{idx}", "type": "text", "text": text, "loc": {"page": idx}})
        tables = data.get("tables") or []
        for t_idx, tbl in enumerate(tables, start=1):
            md = tbl.get("markdown") or ""
            if md:
                markdown_lines.append(f"\n\n### Table {t_idx}\n\n{md}")
                chunks.append({"id": f"t{t_idx}", "type": "text", "text": md, "loc": {}})

        (mdir / "parsed.md").write_text("\n".join(markdown_lines), encoding="utf-8")
        with (mdir / "chunks.jsonl").open("w", encoding="utf-8") as f:
            for ch in chunks:
                f.write(json.dumps(ch, ensure_ascii=False) + "\n")

        (mdir / "status.txt").write_text("ready", encoding="utf-8")
        return {"ready": True, "chunks": len(chunks)}

    async def parse_audio_via_asr(self, material_id: str, filename: str) -> dict[str, Any]:
        mdir = self._material_dir(material_id)
        src = mdir / filename
        if not src.exists():
            raise FileNotFoundError("material file not found")

        result = await self.asr.transcribe(file_bytes=src.read_bytes(), filename=src.name)

        chunks: list[dict[str, Any]] = []
        for idx, seg in enumerate(result.get("segments") or [], start=1):
            chunks.append(
                {
                    "id": f"s{idx}",
                    "type": "subtitle",
                    "text": seg.get("text", ""),
                    "loc": {"startSec": seg.get("start"), "endSec": seg.get("end")},
                }
            )

        with (mdir / "chunks.jsonl").open("a", encoding="utf-8") as f:
            for ch in chunks:
                f.write(json.dumps(ch, ensure_ascii=False) + "\n")

        (mdir / "status.txt").write_text("ready", encoding="utf-8")
        return {"ready": True, "chunks": len(chunks)}

    async def parse_image_with_routing(self, material_id: str, filename: str) -> dict[str, Any]:
        mdir = self._material_dir(material_id)
        src = mdir / filename
        if not src.exists():
            raise FileNotFoundError("material file not found")

        img_bytes = src.read_bytes()
        cls = await self.vqa.classify(file_bytes=img_bytes, filename=src.name)

        chunks: list[dict[str, Any]] = []
        markdown_lines: list[str] = []

        if cls.label in {"text_heavy", "table"}:
            # Route to MinerU image parsing (OCR/table). User agreed: only images flagged by router use MinerU.
            try:
                data = await self.mineru.parse_image(file_bytes=img_bytes, filename=src.name)
            except Exception as exc:
                (mdir / "status.txt").write_text("failed", encoding="utf-8")
                (mdir / "last_error.json").write_text(json.dumps({"stage": "mineru_image", "error": str(exc)}), encoding="utf-8")
                raise
            text = (data.get("text") or "").strip()
            if text:
                markdown_lines.append(text)
                chunks.append({"id": "img_text", "type": "text", "text": text, "loc": {}})
            # Optional: table markdown if provided
            for idx, tbl in enumerate(data.get("tables") or [], start=1):
                md = tbl.get("markdown") or ""
                if md:
                    markdown_lines.append(f"\n\n### Table {idx}\n\n{md}")
                    chunks.append({"id": f"img_tbl_{idx}", "type": "text", "text": md, "loc": {}})
        else:
            # For diagram/photo/chart: produce brief bullets via VQA (placeholder).
            summary = f"Image classified as {cls.label} (p={cls.confidence:.2f})."
            markdown_lines.append(summary)
            chunks.append({"id": "img_caption", "type": "caption", "text": summary, "loc": {}})

        if markdown_lines:
            with (mdir / "parsed.md").open("a", encoding="utf-8") as f:
                f.write("\n" + "\n".join(markdown_lines))
        with (mdir / "chunks.jsonl").open("a", encoding="utf-8") as f:
            for ch in chunks:
                f.write(json.dumps(ch, ensure_ascii=False) + "\n")
        (mdir / "status.txt").write_text("ready", encoding="utf-8")
        return {"ready": True, "chunks": len(chunks)}


