import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.corpus_loader import load_vector_index
from app.handlers import chat as chat_handler
from app.handlers import jd_fit as jd_fit_handler
from app.llm.client import create_llm_client
from app.middleware.body_limit import MaxBodySizeMiddleware
from app.middleware.rate_limit_http import V1RateLimitMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.rate_limit import RateLimiter

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    llm = create_llm_client(
        embed_mode=settings.embed_mode,
        api_key=settings.openai_api_key,
        chat_model=settings.openai_chat_model,
        embed_model=settings.openai_embed_model,
    )
    index = await load_vector_index(llm)
    app.state.settings = settings
    app.state.llm_client = llm
    app.state.vector_index = index
    yield
    await llm.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    limiter = RateLimiter(settings.rate_limit_per_minute)

    app = FastAPI(title="Portfolio API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(MaxBodySizeMiddleware, max_bytes=settings.max_request_body_bytes)
    app.add_middleware(V1RateLimitMiddleware, limiter=limiter)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(chat_handler.router, prefix="/v1")
    app.include_router(jd_fit_handler.router, prefix="/v1")

    return app


app = create_app()
