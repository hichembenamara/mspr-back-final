from __future__ import annotations

from math import ceil
from typing import Any

from fastapi import Query
from pydantic import BaseModel


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


def paginated_response(data: list[Any], page: int, page_size: int, total: int) -> dict[str, Any]:
    return {
        "data": data,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": ceil(total / page_size) if total else 0,
        },
    }
