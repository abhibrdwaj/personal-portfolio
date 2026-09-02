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
