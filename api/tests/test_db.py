import pytest

from app import db


@pytest.mark.asyncio
async def test_create_pool_forwards_dsn(monkeypatch):
    captured = {}

    async def fake_create_pool(dsn, min_size, max_size):
        captured["dsn"] = dsn
        captured["min_size"] = min_size
        captured["max_size"] = max_size
        return "fake-pool"

    monkeypatch.setattr(db.asyncpg, "create_pool", fake_create_pool)
    pool = await db.create_pool("postgresql://user:pass@host/db")
    assert pool == "fake-pool"
    assert captured == {"dsn": "postgresql://user:pass@host/db", "min_size": 1, "max_size": 5}


def test_embedding_to_pgvector_formats_as_bracketed_literal():
    assert db.embedding_to_pgvector([0.1, -0.2, 3.0]) == "[0.1,-0.2,3.0]"


def test_embedding_to_pgvector_rejects_nothing_but_returns_str():
    result = db.embedding_to_pgvector([1, 2, 3])
    assert isinstance(result, str)
    assert result == "[1.0,2.0,3.0]"
