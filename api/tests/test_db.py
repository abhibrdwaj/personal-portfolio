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
