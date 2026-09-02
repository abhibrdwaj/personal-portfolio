import importlib.util
from pathlib import Path

import pytest

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "ingest_corpus.py"


def _load_ingest_module():
    spec = importlib.util.spec_from_file_location("ingest_corpus", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class _NullAsyncCtx:
    async def __aenter__(self):
        return None

    async def __aexit__(self, *exc):
        return False


class FakeConn:
    def __init__(self):
        self.executed: list[tuple] = []

    async def execute(self, query, *args):
        self.executed.append((query, args))

    def transaction(self):
        return _NullAsyncCtx()


class FakePool:
    def __init__(self, conn):
        self._conn = conn

    def acquire(self):
        return self

    async def __aenter__(self):
        return self._conn

    async def __aexit__(self, *exc):
        return False

    async def close(self):
        return None


@pytest.mark.asyncio
async def test_ingest_upserts_every_corpus_chunk(monkeypatch, tmp_path):
    module = _load_ingest_module()

    corpus_dir = tmp_path / "corpus"
    (corpus_dir / "meta").mkdir(parents=True)
    (corpus_dir / "meta" / "about.md").write_text(
        "---\nkind: meta\ntitle: About\n---\n\nHello world.\n", encoding="utf-8"
    )

    conn = FakeConn()
    pool = FakePool(conn)

    async def fake_create_pool(database_url):
        assert database_url == "postgresql://test"
        return pool

    monkeypatch.setattr("app.db.create_pool", fake_create_pool)

    count = await module.ingest(
        corpus_version="abc123",
        database_url="postgresql://test",
        corpus_root=corpus_dir,
    )

    assert count == 1
    assert len(conn.executed) == 1
    query, args = conn.executed[0]
    assert "corpus_chunks" in query
    assert args[0] == "about-0"
    assert args[5] == "abc123"
    # Regression guard: embedding must be a pgvector text literal (a string
    # like "[0.1,0.2]"), not a raw Python list -- asyncpg has no codec for
    # pgvector's `vector` type and raises DataError on a bare list.
    assert isinstance(args[6], str)
    assert args[6].startswith("[") and args[6].endswith("]")
