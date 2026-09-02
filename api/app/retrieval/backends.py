from typing import Protocol

from app.retrieval.index import VectorIndex
from app.retrieval.retrieve import RetrievedChunk, retrieve


class RetrievalBackend(Protocol):
    async def retrieve(
        self,
        query_embedding: list[float],
        *,
        top_k: int = 5,
        min_score: float = 0.12,
        allowed_kinds: set[str] | None = None,
    ) -> list[RetrievedChunk]: ...

    async def aclose(self) -> None: ...


class InMemoryRetrievalBackend:
    """Wraps the existing in-memory NumPy index behind the RetrievalBackend interface."""

    def __init__(self, index: VectorIndex) -> None:
        self._index = index

    async def retrieve(
        self,
        query_embedding: list[float],
        *,
        top_k: int = 5,
        min_score: float = 0.12,
        allowed_kinds: set[str] | None = None,
    ) -> list[RetrievedChunk]:
        return retrieve(
            self._index,
            query_embedding,
            top_k=top_k,
            min_score=min_score,
            allowed_kinds=allowed_kinds,
        )

    async def aclose(self) -> None:
        return None
