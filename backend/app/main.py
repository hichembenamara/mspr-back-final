from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.modules.api import api_router


def create_app() -> FastAPI:
    settings = get_settings()
    fastapi_app = FastAPI(
        title=settings.app_name,
        description="API REST francaise pour HealthAI Coaching.",
        version="0.1.0",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
    )
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(fastapi_app)
    fastapi_app.include_router(api_router, prefix=settings.api_prefix)

    @fastapi_app.get("/health", tags=["health"])
    def health() -> dict:
        return {"data": {"status": "ok"}}

    return fastapi_app


app = create_app()
