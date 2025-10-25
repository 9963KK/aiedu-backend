"""Lightweight vision routing utilities.

Goal: classify images into coarse buckets to decide parsing path.
We use simple heuristics first (text density) and leave a hook for
VQA model classification when configured.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ImageCategory = Literal["text_heavy", "table", "diagram", "chart", "photo"]


@dataclass
class RouteDecision:
    label: ImageCategory
    confidence: float


def route_image_by_heuristics(text_ratio: float, has_grid_like: bool = False) -> RouteDecision:
    """Very rough routing based on extracted text ratio and grid hint.

    text_ratio: proportion (0-1) of textual area (from quick OCR stats or VQA hint).
    has_grid_like: whether grid/table-like patterns are detected (placeholder).
    """
    if has_grid_like and text_ratio > 0.2:
        return RouteDecision("table", 0.7)
    if text_ratio > 0.6:
        return RouteDecision("text_heavy", 0.8)
    if text_ratio < 0.15:
        return RouteDecision("photo", 0.6)
    # default to diagram
    return RouteDecision("diagram", 0.55)


