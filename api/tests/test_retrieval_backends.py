import pytest

from app.retrieval.backends import InMemoryRetrievalBackend
from app.retrieval.index import build_index


@pytest.mark.asyncio
async def test_in_memory_backend_wraps_retrieve():
    index = build_index(
        ["a", "b"],
        ["T1", "T2"],
        ["experience", "project"],
        ["x", "y"],
        [[1.0, 0.0], [0.0, 1.0]],
    )
    backend = InMemoryRetrievalBackend(index)
    hits = await backend.retrieve([1.0, 0.0], top_k=2, min_score=-1.0)
    assert [h.chunk_id for h in hits] == ["a", "b"]
    await backend.aclose()


class FakePool:
    def __init__(self, rows):
        self._rows = rows
        self.calls: list[tuple] = []

    async def fetch(self, query, *args):
        self.calls.append((query, args))
        return self._rows

    async def close(self) -> None:
        return None


@pytest.mark.asyncio
async def test_pgvector_backend_maps_rows_and_filters_by_score():
    from app.retrieval.backends import PgVectorRetrievalBackend

    rows = [
        {"chunk_id": "a", "title": "T1", "kind": "experience", "text": "x", "score": 0.9},
        {"chunk_id": "b", "title": "T2", "kind": "project", "text": "y", "score": 0.05},
    ]
    pool = FakePool(rows)
    backend = PgVectorRetrievalBackend(pool)
    hits = await backend.retrieve([1.0, 0.0], top_k=5, min_score=0.1)
    assert [h.chunk_id for h in hits] == ["a"]
    await backend.aclose()


@pytest.mark.asyncio
async def test_pgvector_backend_passes_allowed_kinds_as_sorted_list():
    from app.retrieval.backends import PgVectorRetrievalBackend

    pool = FakePool([])
    backend = PgVectorRetrievalBackend(pool)
    await backend.retrieve([1.0, 0.0], top_k=5, min_score=-1.0, allowed_kinds={"project", "experience"})
    _, args = pool.calls[0]
    assert args[2] == ["experience", "project"]


@pytest.mark.asyncio
async def test_create_retrieval_backend_in_memory():
    from app.config import Settings
    from app.llm.client import MockLLMClient
    from app.retrieval.backends import create_retrieval_backend

    settings = Settings(VECTOR_BACKEND="in_memory", OPENAI_API_KEY="sk-test")
    backend = await create_retrieval_backend(settings, MockLLMClient())
    assert isinstance(backend, InMemoryRetrievalBackend)
    await backend.aclose()


@pytest.mark.asyncio
async def test_create_retrieval_backend_pgvector(monkeypatch):
    from app.config import Settings
    from app.retrieval import backends as backends_module

    async def fake_create_pool(database_url):
        assert database_url == "postgresql://test"
        return FakePool([])

    monkeypatch.setattr(backends_module, "create_pool", fake_create_pool)
    settings = Settings(
        VECTOR_BACKEND="pgvector", DATABASE_URL="postgresql://test", OPENAI_API_KEY="sk-test"
    )
    backend = await backends_module.create_retrieval_backend(settings, None)
    assert isinstance(backend, backends_module.PgVectorRetrievalBackend)
    await backend.aclose()
