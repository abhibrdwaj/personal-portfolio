from typing import TYPE_CHECKING, Protocol

from app.corpus_loader import load_vector_index
from app.db import create_pool
from app.llm.client import LLMClient
from app.retrieval.index import VectorIndex
from app.retrieval.retrieve import RetrievedChunk, retrieve

if TYPE_CHECKING:
    import asyncpg

    from app.config import Settings


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


class PgVectorRetrievalBackend:
    """Retrieval backend querying a Postgres/pgvector `corpus_chunks` table."""

    def __init__(self, pool: "asyncpg.Pool") -> None:
        self._pool = pool

    async def retrieve(
        self,
        query_embedding: list[float],
        *,
        top_k: int = 5,
        min_score: float = 0.12,
        allowed_kinds: set[str] | None = None,
    ) -> list[RetrievedChunk]:
        kinds_filter = sorted(allowed_kinds) if allowed_kinds is not None else None
        rows = await self._pool.fetch(
            """
            SELECT chunk_id, title, kind, text,
                   1 - (embedding <=> $1::vector) AS score
            FROM corpus_chunks
            WHERE ($3::text[] IS NULL OR kind = ANY($3::text[]))
            ORDER BY embedding <=> $1::vector
            LIMIT $2
            """,
            query_embedding,
            top_k,
            kinds_filter,
        )
        out: list[RetrievedChunk] = []
        for row in rows:
            score = float(row["score"])
            if min_score >= 0 and score < min_score:
                continue
            out.append(
                RetrievedChunk(
                    chunk_id=row["chunk_id"],
                    title=row["title"],
                    kind=row["kind"],
                    text=row["text"],
                    score=score,
                )
            )
        return out

    async def aclose(self) -> None:
        await self._pool.close()


async def create_retrieval_backend(settings: "Settings", llm: LLMClient) -> RetrievalBackend:
    """Build the retrieval backend configured by `settings.vector_backend`."""
    if settings.vector_backend == "pgvector":
        pool = await create_pool(settings.database_url)
        return PgVectorRetrievalBackend(pool)
    index = await load_vector_index(llm)
    return InMemoryRetrievalBackend(index)
