from fastapi import Request

from app.config import Settings
from app.llm.client import LLMClient
from app.retrieval.backends import RetrievalBackend


def get_llm_client(request: Request) -> LLMClient:
    return request.app.state.llm_client


def get_retrieval_backend(request: Request) -> RetrievalBackend:
    return request.app.state.retrieval_backend


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings
