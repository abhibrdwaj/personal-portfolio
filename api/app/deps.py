from fastapi import Request

from app.config import Settings
from app.llm.client import LLMClient
from app.retrieval.index import VectorIndex


def get_llm_client(request: Request) -> LLMClient:
    return request.app.state.llm_client


def get_vector_index(request: Request) -> VectorIndex:
    return request.app.state.vector_index


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings
