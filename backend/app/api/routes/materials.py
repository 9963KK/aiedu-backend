"""Endpoints for multimodal materials ingestion and retrieval.

This first iteration stores uploads in a local temporary directory and returns
basic metadata. S3 persistence is not implemented yet; requesting original file
URL will return 501 Not Implemented as per product decision.
"""

from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
import json
from typing import Any, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.parse_service import ParseService


router = APIRouter(prefix="/materials", tags=["materials"])


class MaterialStatus(BaseModel):
    material_id: str = Field(alias="materialId")
    status: Literal["uploaded", "queued", "processing", "ready", "failed"]
    mime: str
    original_name: str = Field(alias="originalName")
    size_bytes: int = Field(alias="sizeBytes")


class MaterialMeta(BaseModel):
    material_id: str = Field(alias="materialId")
    course_id: str | None = Field(default=None, alias="courseId")
    title: str | None = None
    mime: str
    status: str
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")
    original_url: str | None = Field(default=None, alias="originalUrl")
    meta: dict[str, Any] = {}


def _ensure_tmp_dir() -> Path:
    tmp = Path(settings.storage_tmp_dir)
    tmp.mkdir(parents=True, exist_ok=True)
    return tmp


def _validate_size(file: UploadFile) -> None:
    # NOTE: FastAPI doesn't expose size directly; callers should enforce on client
    # or we can stream to disk and check. Here we accept and rely on reverse proxy
    # and client to cap size; keep placeholder for future checks.
    return None


@router.post("")
async def upload_material(
    file: UploadFile = File(...),
    courseId: str | None = Form(default=None),
    title: str | None = Form(default=None),
    tags: str | None = Form(default=None),
) -> dict[str, Any]:
    allowed = {
        "txt",
        "pdf",
        "ppt",
        "pptx",
        "doc",
        "docx",
        "jpg",
        "jpeg",
        "png",
        "mp3",
        "m4a",
        "wav",
        "mp4",
    }
    suffix = (file.filename or "").split(".")[-1].lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{suffix}")

    _validate_size(file)

    mat_id = f"mat_{uuid.uuid4().hex[:12]}"
    tmp_dir = _ensure_tmp_dir() / mat_id
    tmp_dir.mkdir(parents=True, exist_ok=True)
    dest = tmp_dir / (file.filename or "upload.bin")

    # Persist to local tmp
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    payload = MaterialStatus(
        materialId=mat_id,
        status="uploaded",
        mime=file.content_type or "application/octet-stream",
        originalName=file.filename or "unknown",
        sizeBytes=dest.stat().st_size,
    )
    return {"data": payload.model_dump(by_alias=True), "error": None}


@router.get("/{material_id}")
async def get_material(material_id: str) -> dict[str, Any]:
    # Minimal stub: read from tmp folder if exists
    tmp_dir = _ensure_tmp_dir() / material_id
    if not tmp_dir.exists():
        raise HTTPException(status_code=404, detail="Material not found")

    # Placeholder metadata
    status_file = tmp_dir / "status.txt"
    status_value = "uploaded"
    if status_file.exists():
        try:
            status_value = status_file.read_text(encoding="utf-8").strip() or "uploaded"
        except Exception:
            status_value = "uploaded"
    meta = MaterialMeta(
        materialId=material_id,
        courseId=None,
        title=None,
        mime="application/octet-stream",
        status=status_value,
        createdAt=None,
        updatedAt=None,
        originalUrl=None,
        meta={},
    )
    return {"data": meta.model_dump(by_alias=True), "error": None}


@router.get("/{material_id}/original-url")
async def get_original_presigned_url(material_id: str) -> dict[str, Any]:
    # S3 not implemented: return 501
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "S3 not configured: set S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY/"
            "S3_SECRET_KEY to enable presigned URLs"
        ),
    )


@router.get("/{material_id}/chunks")
async def list_chunks(
    material_id: str,
    offset: int = 0,
    limit: int = 100,
    type: Literal["text", "caption", "subtitle"] | None = None,
) -> dict[str, Any]:
    tmp_dir = _ensure_tmp_dir() / material_id
    if not tmp_dir.exists():
        raise HTTPException(status_code=404, detail="Material not found")

    chunks_path = tmp_dir / "chunks.jsonl"
    if not chunks_path.exists():
        return {"data": {"items": [], "pagination": {"offset": offset, "limit": limit, "total": 0}}, "error": None}

    items: list[dict[str, Any]] = []
    total = 0
    with chunks_path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            if type and obj.get("type") != type:
                total += 1
                continue
            total += 1
            idx = total - 1
            if idx < offset:
                continue
            if len(items) >= limit:
                break
            items.append(obj)

    return {"data": {"items": items, "pagination": {"offset": offset, "limit": limit, "total": total}}, "error": None}


@router.post("/{material_id}/parse")
async def reparse(material_id: str, mode: Literal["auto", "vision", "asr", "text"] = "auto") -> dict[str, Any]:
    """Trigger parsing for a material. For documents, call MinerU."""
    tmp_dir = _ensure_tmp_dir() / material_id
    if not tmp_dir.exists():
        raise HTTPException(status_code=404, detail="Material not found")

    # find the first file in the material dir
    try:
        file_path = next(p for p in tmp_dir.iterdir() if p.is_file())
    except StopIteration as exc:
        raise HTTPException(status_code=400, detail="No file found for material") from exc

    # mark processing
    try:
        (tmp_dir / "status.txt").write_text("processing", encoding="utf-8")
    except Exception:
        pass

    suffix = file_path.suffix.lower().lstrip(".")
    if suffix in {"pdf", "ppt", "pptx", "doc", "docx"}:
        svc = ParseService()
        result = await svc.parse_document_via_mineru(material_id=material_id, filename=file_path.name)
        return {"data": {"materialId": material_id, **result}, "error": None}

    if suffix in {"mp3", "m4a", "wav"}:
        svc = ParseService()
        result = await svc.parse_audio_via_asr(material_id=material_id, filename=file_path.name)
        return {"data": {"materialId": material_id, **result}, "error": None}

    if suffix in {"jpg", "jpeg", "png"}:
        svc = ParseService()
        result = await svc.parse_image_with_routing(material_id=material_id, filename=file_path.name)
        return {"data": {"materialId": material_id, **result}, "error": None}

    # others no-op for now
    return {"data": {"materialId": material_id, "accepted": True, "mode": mode}, "error": None}


@router.post("/{material_id}/cancel")
async def cancel_parse(material_id: str) -> dict[str, Any]:
    """Cancel parsing task for a material (placeholder).

    Since parsing queue isn't wired yet, we simply create a cancellation flag
    under the material tmp directory so future workers can short‑circuit.
    """
    tmp_dir = _ensure_tmp_dir() / material_id
    if not tmp_dir.exists():
        raise HTTPException(status_code=404, detail="Material not found")

    try:
        flag = tmp_dir / ".cancelled"
        flag.write_text("1")
    except OSError:
        # best-effort; still report accepted
        pass
    return {"data": {"cancelled": True}, "error": None}


@router.get("")
async def list_materials(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    base = _ensure_tmp_dir()
    ids = [p.name for p in base.iterdir() if p.is_dir()]
    total = len(ids)
    page = ids[offset : offset + limit]
    items = [
        {
            "materialId": mid,
            "status": "uploaded",
        }
        for mid in page
    ]
    return {"data": {"items": items, "pagination": {"offset": offset, "limit": limit, "total": total}}, "error": None}


@router.delete("/{material_id}")
async def delete_material(material_id: str) -> dict[str, Any]:
    tmp_dir = _ensure_tmp_dir() / material_id
    if not tmp_dir.exists():
        raise HTTPException(status_code=404, detail="Material not found")
    shutil.rmtree(tmp_dir, ignore_errors=True)
    return {"data": {"deleted": True}, "error": None}


