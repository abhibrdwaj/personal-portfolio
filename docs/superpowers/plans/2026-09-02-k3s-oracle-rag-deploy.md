# k3s + Oracle Cloud Self-Hosted RAG Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `api/` from "runs only on a laptop" to a real production deployment: a self-hosted single-node k3s cluster on a free Oracle Cloud ARM VM, with a self-hosted Postgres/pgvector store replacing the in-memory vector index, served over free HTTPS, deployed via CI.

**Architecture:** A `RetrievalBackend` abstraction lets the app pick between today's in-memory index (default, used by all local dev/tests) and a new `PgVectorRetrievalBackend` (used in production) via one env var. Corpus embedding moves out of app-boot entirely and into a separate, idempotent `ingest_corpus.py` script run as a Kubernetes Job, tagged by git SHA. Everything ships as plain Kubernetes YAML manifests applied to a single-node k3s cluster, with cert-manager + a free DuckDNS hostname providing TLS, and GitHub Actions extending the existing test workflow to build, push, and roll out on every merge to `main`.

**Tech Stack:** FastAPI, asyncpg, Postgres (`pgvector/pgvector` image), k3s (Traefik ingress, local-path storage), cert-manager, Let's Encrypt, DuckDNS, GitHub Container Registry, GitHub Actions.

**Spec:** [docs/superpowers/specs/2026-09-02-k3s-oracle-rag-deploy-design.md](../specs/2026-09-02-k3s-oracle-rag-deploy-design.md)

## Global Constraints

- Fixed recurring infrastructure cost must stay $0 (Oracle Always Free tier). OpenAI API usage is the one accepted usage-based cost and is unrelated to hosting choice.
- Single k3s node, single `portfolio-api` replica in v1 — the existing rate limiter (`api/app/rate_limit.py`) is per-process memory, so more replicas would silently multiply the effective limit. This is a documented v1 limitation, not something this plan fixes.
- No Helm, Kustomize, GitOps controller, or cluster metrics stack (Prometheus/Grafana) in v1 — plain YAML manifests only.
- Local dev and `pytest` must keep working fully offline against the in-memory backend (`VECTOR_BACKEND=in_memory`, the default) — no test in this plan may require a real Postgres connection or network access.
- Postgres access uses `asyncpg` directly — no ORM.
- Production `CORS_ORIGINS` must be `https://abhibrdwaj.github.io` — set via the Kubernetes Secret in Task 11, never as a code default.

---

### Task 1: Retrieval backend abstraction (behavior-preserving refactor)

**Files:**
- Create: `api/app/retrieval/backends.py`
- Modify: `api/app/deps.py`
- Modify: `api/app/main.py`
- Modify: `api/app/handlers/chat.py`
- Modify: `api/app/handlers/jd_fit.py`
- Test: `api/tests/test_retrieval_backends.py`

**Interfaces:**
- Produces: `RetrievalBackend` (Protocol: `async def retrieve(query_embedding: list[float], *, top_k: int = 5, min_score: float = 0.12, allowed_kinds: set[str] | None = None) -> list[RetrievedChunk]`, `async def aclose() -> None`), `InMemoryRetrievalBackend(index: VectorIndex)` implementing it.
- Consumes: `retrieve()` and `RetrievedChunk` from `app.retrieval.retrieve`, `VectorIndex` from `app.retrieval.index`.

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_retrieval_backends.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && source .venv/bin/activate && pytest tests/test_retrieval_backends.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.retrieval.backends'`

- [ ] **Step 3: Write the minimal implementation**

```python
# api/app/retrieval/backends.py
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_retrieval_backends.py -v`
Expected: PASS

- [ ] **Step 5: Rewire `deps.py` to expose the backend instead of the raw index**

Replace the whole contents of `api/app/deps.py`:

```python
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
```

- [ ] **Step 6: Rewire `main.py`'s lifespan to build and close the backend**

In `api/app/main.py`, replace:

```python
    index = await load_vector_index(llm)
    app.state.settings = settings
    app.state.llm_client = llm
    app.state.vector_index = index
    yield
    await llm.aclose()
```

with:

```python
    index = await load_vector_index(llm)
    app.state.settings = settings
    app.state.llm_client = llm
    app.state.retrieval_backend = InMemoryRetrievalBackend(index)
    yield
    await app.state.retrieval_backend.aclose()
    await llm.aclose()
```

Add `from app.retrieval.backends import InMemoryRetrievalBackend` to the imports at the top of `main.py`.

- [ ] **Step 7: Update `chat.py` to depend on the backend**

In `api/app/handlers/chat.py`:
- Change the import `from app.deps import get_app_settings, get_llm_client, get_vector_index` to `from app.deps import get_app_settings, get_llm_client, get_retrieval_backend`.
- Remove the line `from app.retrieval.index import VectorIndex`.
- Change `from app.retrieval.retrieve import retrieve` to `from app.retrieval.backends import RetrievalBackend`.
- In the `chat()` signature, change `index: VectorIndex = Depends(get_vector_index),` to `backend: RetrievalBackend = Depends(get_retrieval_backend),`.
- Change the retrieval call `chunks = retrieve(index, q_emb, top_k=5, min_score=0.12, allowed_kinds=PUBLIC_CHAT_KINDS)` to `chunks = await backend.retrieve(q_emb, top_k=5, min_score=0.12, allowed_kinds=PUBLIC_CHAT_KINDS)`.

- [ ] **Step 8: Update `jd_fit.py` to depend on the backend**

In `api/app/handlers/jd_fit.py`:
- Change the import `from app.deps import get_app_settings, get_llm_client, get_vector_index` to `from app.deps import get_app_settings, get_llm_client, get_retrieval_backend`.
- Remove the line `from app.retrieval.index import VectorIndex`.
- Change `from app.retrieval.retrieve import retrieve` to `from app.retrieval.backends import RetrievalBackend`.
- In the `jd_fit()` signature, change `index: VectorIndex = Depends(get_vector_index),` to `backend: RetrievalBackend = Depends(get_retrieval_backend),`.
- Change the retrieval call `hits = retrieve(index, emb, top_k=4, min_score=0.1)` to `hits = await backend.retrieve(emb, top_k=4, min_score=0.1)`.

- [ ] **Step 9: Run the full suite to confirm the refactor is behavior-preserving**

Run: `pytest -v`
Expected: PASS, every existing test green plus the new `test_in_memory_backend_wraps_retrieve`.

- [ ] **Step 10: Commit**

```bash
git add api/app/retrieval/backends.py api/app/deps.py api/app/main.py api/app/handlers/chat.py api/app/handlers/jd_fit.py api/tests/test_retrieval_backends.py
git commit -m "refactor: introduce RetrievalBackend abstraction (in-memory only, behavior-preserving)"
```

---

### Task 2: Postgres driver, settings, and connection pool helper

**Files:**
- Modify: `api/pyproject.toml`
- Modify: `api/app/config.py`
- Create: `api/app/db.py`
- Test: `api/tests/test_db.py`

**Interfaces:**
- Produces: `Settings.vector_backend: Literal["in_memory", "pgvector"]` (default `"in_memory"`), `Settings.database_url: str` (default `""`), `create_pool(database_url: str) -> asyncpg.Pool` in `app.db`.
- Consumes: nothing new.

- [ ] **Step 1: Add the dependency**

In `api/pyproject.toml`, add `"asyncpg>=0.29.0",` to the `dependencies` list (after `"numpy>=1.26.0",`).

Run: `cd api && source .venv/bin/activate && pip install -e ".[dev]"`
Expected: installs `asyncpg` into the venv.

- [ ] **Step 2: Write the failing test**

```python
# api/tests/test_db.py
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_db.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.db'`

- [ ] **Step 4: Write the minimal implementation**

```python
# api/app/db.py
import asyncpg


async def create_pool(database_url: str) -> asyncpg.Pool:
    """Create an asyncpg connection pool for the pgvector retrieval backend."""
    return await asyncpg.create_pool(dsn=database_url, min_size=1, max_size=5)
```

- [ ] **Step 5: Add the two new settings**

In `api/app/config.py`, add these two lines to the `Settings` class, immediately after the `embed_mode` field:

```python
    vector_backend: Literal["in_memory", "pgvector"] = Field(default="in_memory", alias="VECTOR_BACKEND")
    database_url: str = Field(default="", alias="DATABASE_URL")
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pytest tests/test_db.py -v`
Expected: PASS

- [ ] **Step 7: Run the full suite**

Run: `pytest -v`
Expected: PASS, all tests green.

- [ ] **Step 8: Commit**

```bash
git add api/pyproject.toml api/app/config.py api/app/db.py api/tests/test_db.py
git commit -m "feat: add asyncpg dependency, VECTOR_BACKEND/DATABASE_URL settings, and create_pool helper"
```

---

### Task 3: `PgVectorRetrievalBackend` + backend factory wired into app startup

**Files:**
- Modify: `api/app/retrieval/backends.py`
- Create: `api/db/schema.sql`
- Modify: `api/app/main.py`
- Test: `api/tests/test_retrieval_backends.py`

**Interfaces:**
- Consumes: `create_pool` from `app.db` (Task 2), `load_vector_index` from `app.corpus_loader`, `Settings` from `app.config`, `LLMClient` from `app.llm.client`.
- Produces: `PgVectorRetrievalBackend(pool)` implementing `RetrievalBackend`, `create_retrieval_backend(settings: Settings, llm: LLMClient) -> RetrievalBackend`.

- [ ] **Step 1: Write the failing tests**

Append to `api/tests/test_retrieval_backends.py`:

```python
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

    settings = Settings(vector_backend="in_memory", openai_api_key="sk-test")
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
    settings = Settings(vector_backend="pgvector", database_url="postgresql://test", openai_api_key="sk-test")
    backend = await backends_module.create_retrieval_backend(settings, None)
    assert isinstance(backend, backends_module.PgVectorRetrievalBackend)
    await backend.aclose()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_retrieval_backends.py -v`
Expected: FAIL — `PgVectorRetrievalBackend` and `create_retrieval_backend` don't exist yet.

- [ ] **Step 3: Write the minimal implementation**

Append to `api/app/retrieval/backends.py` (add these imports at the top alongside the existing ones: `from typing import TYPE_CHECKING`, `from app.corpus_loader import load_vector_index`, `from app.db import create_pool`, `from app.llm.client import LLMClient`; add `if TYPE_CHECKING:` guarding `import asyncpg` and `from app.config import Settings` to avoid import cycles):

```python
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
```

Note: `1 - (embedding <=> $1::vector)` converts pgvector's cosine *distance* operator into a cosine *similarity* score, so `min_score` thresholds behave identically to the in-memory backend's cosine-similarity scores.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_retrieval_backends.py -v`
Expected: PASS

- [ ] **Step 5: Write the schema (reviewed by reading, not by pytest — there is no Postgres in this environment; it's applied for real in Task 11)**

```sql
-- api/db/schema.sql
-- Applied once during initial cluster setup (see deploy/k3s/RUNBOOK.md).
-- Embedding dimension (1536) matches OpenAI's text-embedding-3-small
-- (the OPENAI_EMBED_MODEL default in api/app/config.py) -- update both
-- together if the embedding model ever changes.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS corpus_chunks (
    chunk_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    kind TEXT NOT NULL,
    text TEXT NOT NULL,
    text_sha256 TEXT NOT NULL,
    corpus_version TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No ANN index (ivfflat/hnsw) yet -- the corpus is under 200 rows, so a
-- sequential scan with the <=> operator is fast enough. Add one only if
-- the corpus grows enough to make that measurably slow.
```

- [ ] **Step 6: Wire the factory into app startup**

In `api/app/main.py`, replace:

```python
    index = await load_vector_index(llm)
    app.state.settings = settings
    app.state.llm_client = llm
    app.state.retrieval_backend = InMemoryRetrievalBackend(index)
```

with:

```python
    app.state.settings = settings
    app.state.llm_client = llm
    app.state.retrieval_backend = await create_retrieval_backend(settings, llm)
```

Change the import `from app.retrieval.backends import InMemoryRetrievalBackend` to `from app.retrieval.backends import create_retrieval_backend`, and remove the now-unused `from app.corpus_loader import load_vector_index` import from `main.py` (the factory calls it internally now).

- [ ] **Step 7: Run the full suite**

Run: `pytest -v`
Expected: PASS, all tests green. (Every existing test still runs against `VECTOR_BACKEND=in_memory`, the default, so nothing touches Postgres.)

- [ ] **Step 8: Commit**

```bash
git add api/app/retrieval/backends.py api/db/schema.sql api/app/main.py api/tests/test_retrieval_backends.py
git commit -m "feat: add PgVectorRetrievalBackend and VECTOR_BACKEND-driven startup selection"
```

---

### Task 4: Extract a shared corpus-parsing helper (for reuse by the ingest script)

**Files:**
- Modify: `api/app/corpus_loader.py`
- Modify: `api/scripts/run_golden.py`
- Test: `api/tests/test_corpus_loader.py`

**Interfaces:**
- Produces: `CorpusChunkRow` (frozen dataclass: `chunk_id: str, title: str, kind: str, text: str, source_file: str, embed_input: str`), `iter_corpus_chunk_rows(root: Path, *, max_chars: int = 1200) -> list[CorpusChunkRow]`, `parse_frontmatter(raw: str, path: Path) -> tuple[dict[str, str], str]` (renamed from `_parse_frontmatter`, same signature and behavior).
- Consumes: nothing new. `load_vector_index()` keeps its existing signature and behavior.

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_corpus_loader.py
from app.corpus_loader import default_corpus_root, iter_corpus_chunk_rows


def test_iter_corpus_chunk_rows_covers_real_corpus():
    rows = iter_corpus_chunk_rows(default_corpus_root())
    assert rows
    assert all(r.chunk_id and r.kind and r.embed_input for r in rows)
    chunk_ids = [r.chunk_id for r in rows]
    assert len(chunk_ids) == len(set(chunk_ids))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_corpus_loader.py -v`
Expected: FAIL with `ImportError: cannot import name 'iter_corpus_chunk_rows'`

- [ ] **Step 3: Refactor `corpus_loader.py`**

Rename `_parse_frontmatter` to `parse_frontmatter` (update its `def` line and its one call site inside the same file). Add a `CorpusChunkRow` dataclass and an `iter_corpus_chunk_rows` function, then rewrite `load_vector_index` to use it:

```python
@dataclass(frozen=True)
class CorpusChunkRow:
    chunk_id: str
    title: str
    kind: str
    text: str
    source_file: str
    embed_input: str


def iter_corpus_chunk_rows(root: Path, *, max_chars: int = 1200) -> list[CorpusChunkRow]:
    paths = sorted(root.glob("**/*.md"))
    if not paths:
        raise RuntimeError(f"No markdown corpus files under {root}")

    rows: list[CorpusChunkRow] = []
    for path in paths:
        raw = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw, path)
        kind = meta.get("kind", "").strip().lower()
        if not kind:
            raise RuntimeError(f"Corpus file requires frontmatter key `kind`: {path}")
        if kind not in ALLOWED_KINDS:
            raise RuntimeError(f"Unsupported corpus kind `{kind}` in {path}")

        allowed_by_folder = _infer_folder_kind_policy(path, root)
        if allowed_by_folder is not None and kind not in allowed_by_folder:
            allowed_csv = ", ".join(sorted(allowed_by_folder))
            raise RuntimeError(
                f"Corpus kind `{kind}` invalid for folder of {path}. Expected one of: {allowed_csv}"
            )

        title = meta.get("title", "").strip() or path.stem.replace("_", " ").title()
        parts = chunk_text(body, max_chars=max_chars)
        rel = path.relative_to(root).as_posix()
        for i, part in enumerate(parts):
            rows.append(
                CorpusChunkRow(
                    chunk_id=f"{path.stem}-{i}",
                    title=title,
                    kind=kind,
                    text=part,
                    source_file=rel,
                    embed_input=f"{title}\n\nkind: {kind}\n\n{part}",
                )
            )
    return rows


async def load_vector_index(
    llm: LLMClient,
    corpus_root: Path | None = None,
    *,
    max_chars: int = 1200,
) -> VectorIndex:
    root = corpus_root or default_corpus_root()
    rows = iter_corpus_chunk_rows(root, max_chars=max_chars)
    embeddings = await llm.embed([r.embed_input for r in rows])
    return build_index(
        [r.chunk_id for r in rows],
        [r.title for r in rows],
        [r.kind for r in rows],
        [r.text for r in rows],
        embeddings,
    )
```

- [ ] **Step 4: Update `run_golden.py`'s import**

In `api/scripts/run_golden.py`, change `from app.corpus_loader import _parse_frontmatter, default_corpus_root, load_vector_index` to `from app.corpus_loader import default_corpus_root, load_vector_index, parse_frontmatter`, and change its call site `meta, body = _parse_frontmatter(raw, path)` to `meta, body = parse_frontmatter(raw, path)`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_corpus_loader.py -v`
Expected: PASS

- [ ] **Step 6: Run the full suite (this also re-runs the golden script subprocess test)**

Run: `pytest -v`
Expected: PASS, all tests green.

- [ ] **Step 7: Commit**

```bash
git add api/app/corpus_loader.py api/scripts/run_golden.py api/tests/test_corpus_loader.py
git commit -m "refactor: extract iter_corpus_chunk_rows, rename parse_frontmatter (drop leading underscore)"
```

---

### Task 5: `ingest_corpus.py` — idempotent corpus ingestion into Postgres

**Files:**
- Create: `api/scripts/ingest_corpus.py`
- Test: `api/tests/test_ingest_corpus.py`

**Interfaces:**
- Consumes: `iter_corpus_chunk_rows`, `default_corpus_root` (Task 4), `create_pool` (Task 2), `create_llm_client` (existing).
- Produces: `async def ingest(*, corpus_version: str, database_url: str, corpus_root: Path | None = None) -> int` (returns number of chunks ingested), a CLI entry point (`python scripts/ingest_corpus.py --corpus-version <sha> --database-url <url>`).

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_ingest_corpus.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ingest_corpus.py -v`
Expected: FAIL — `api/scripts/ingest_corpus.py` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```python
#!/usr/bin/env python3
"""Idempotently embed api/corpus/**/*.md into the corpus_chunks Postgres table."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


async def ingest(
    *,
    corpus_version: str,
    database_url: str,
    corpus_root: Path | None = None,
) -> int:
    from app.config import get_settings
    from app.corpus_loader import default_corpus_root, iter_corpus_chunk_rows
    from app.db import create_pool
    from app.llm.client import create_llm_client

    settings = get_settings()
    llm = create_llm_client(
        embed_mode=settings.embed_mode,
        api_key=settings.openai_api_key,
        chat_model=settings.openai_chat_model,
        embed_model=settings.openai_embed_model,
    )
    root = corpus_root or default_corpus_root()
    rows = iter_corpus_chunk_rows(root)
    embeddings = await llm.embed([r.embed_input for r in rows])
    await llm.aclose()

    pool = await create_pool(database_url)
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                for row, embedding in zip(rows, embeddings):
                    await conn.execute(
                        """
                        INSERT INTO corpus_chunks
                            (chunk_id, title, kind, text, text_sha256, corpus_version, embedding, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7::vector, now())
                        ON CONFLICT (chunk_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            kind = EXCLUDED.kind,
                            text = EXCLUDED.text,
                            text_sha256 = EXCLUDED.text_sha256,
                            corpus_version = EXCLUDED.corpus_version,
                            embedding = EXCLUDED.embedding,
                            updated_at = now()
                        WHERE corpus_chunks.text_sha256 IS DISTINCT FROM EXCLUDED.text_sha256
                        """,
                        row.chunk_id,
                        row.title,
                        row.kind,
                        row.text,
                        _sha256_text(row.text),
                        corpus_version,
                        embedding,
                    )
    finally:
        await pool.close()

    print(f"Ingested {len(rows)} chunks at corpus_version={corpus_version}")
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest api/corpus into Postgres/pgvector.")
    parser.add_argument("--corpus-version", required=True, help="e.g. $(git rev-parse --short HEAD)")
    parser.add_argument("--database-url", default=os.environ.get("DATABASE_URL", ""))
    args = parser.parse_args()
    if not args.database_url:
        print("--database-url or DATABASE_URL is required", file=sys.stderr)
        sys.exit(1)
    asyncio.run(ingest(corpus_version=args.corpus_version, database_url=args.database_url))


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_ingest_corpus.py -v`
Expected: PASS

- [ ] **Step 5: Run the full suite**

Run: `pytest -v`
Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
git add api/scripts/ingest_corpus.py api/tests/test_ingest_corpus.py
git commit -m "feat: add idempotent corpus ingestion script for the pgvector backend"
```

---

### Task 6: Dockerfile

**Files:**
- Create: `api/Dockerfile`
- Create: `api/.dockerignore`

**Interfaces:** none (build artifact only).

- [ ] **Step 1: Write `api/Dockerfile`**

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY app ./app
COPY scripts ./scripts

RUN pip install --upgrade pip && pip install .

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

- [ ] **Step 2: Write `api/.dockerignore`**

```
.venv
__pycache__
*.pyc
tests
.git
.env
dist
```

- [ ] **Step 3: Verify (no Docker available in this environment)**

Docker isn't installed in this sandbox, so the build itself can't be run here. Read the Dockerfile back and confirm: it copies `app/`, `scripts/`, and `pyproject.toml` (everything `ingest_corpus.py` and `uvicorn app.main:app` need), installs via `pip install .`, and exposes `8080` to match `deploy/k3s/api.yaml`'s `containerPort` (Task 8). The real first build+run happens on the Oracle VM in Task 11, where Docker ships as part of k3s/containerd tooling.

- [ ] **Step 4: Commit**

```bash
git add api/Dockerfile api/.dockerignore
git commit -m "build: add production Dockerfile for portfolio-api"
```

---

### Task 7: Postgres Kubernetes manifests

**Files:**
- Create: `deploy/k3s/namespace.yaml`
- Create: `deploy/k3s/postgres-secret.example.yaml`
- Create: `deploy/k3s/postgres.yaml`

**Interfaces:** none (static manifests; `postgres.portfolio.svc.cluster.local:5432` is the DNS name later manifests/secrets reference).

- [ ] **Step 1: Write `deploy/k3s/namespace.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: portfolio
```

- [ ] **Step 2: Write `deploy/k3s/postgres-secret.example.yaml`**

This is a template only — copy it to `postgres-secret.yaml` (git-ignored) with a real password before applying; never commit the real one.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: portfolio
type: Opaque
stringData:
  POSTGRES_USER: portfolio
  POSTGRES_PASSWORD: REPLACE_ME
  POSTGRES_DB: portfolio
```

- [ ] **Step 3: Write `deploy/k3s/postgres.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: portfolio
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: portfolio
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: pgvector/pgvector:pg16
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: postgres-credentials
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "portfolio"]
            initialDelaySeconds: 5
            periodSeconds: 5
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: local-path
        resources:
          requests:
            storage: 5Gi
```

- [ ] **Step 4: Validate YAML syntax**

Run: `python3 -c "import yaml; [list(yaml.safe_load_all(open(f))) for f in ['deploy/k3s/namespace.yaml', 'deploy/k3s/postgres-secret.example.yaml', 'deploy/k3s/postgres.yaml']]"`
Expected: no output, exit code 0 (confirms valid YAML; there's no cluster here to `kubectl apply` against — that happens for real in Task 11).

- [ ] **Step 5: Add the real (git-ignored) secret filename to `.gitignore`**

Add this line to the repository's root `.gitignore`: `deploy/k3s/postgres-secret.yaml`

- [ ] **Step 6: Commit**

```bash
git add deploy/k3s/namespace.yaml deploy/k3s/postgres-secret.example.yaml deploy/k3s/postgres.yaml .gitignore
git commit -m "infra: add Postgres/pgvector k3s manifests"
```

---

### Task 8: API Kubernetes manifests

**Files:**
- Create: `deploy/k3s/api-secret.example.yaml`
- Create: `deploy/k3s/api.yaml`

**Interfaces:** consumes `postgres.portfolio.svc.cluster.local:5432` (Task 7); produces the `portfolio-api` Service (port 80 → container port 8080) that Task 9's Ingress routes to.

- [ ] **Step 1: Write `deploy/k3s/api-secret.example.yaml`**

Template only — copy to `api-secret.yaml` (git-ignored) with real values before applying.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: portfolio-api-credentials
  namespace: portfolio
type: Opaque
stringData:
  OPENAI_API_KEY: REPLACE_ME
  DATABASE_URL: postgresql://portfolio:REPLACE_ME_SAME_AS_POSTGRES_PASSWORD@postgres.portfolio.svc.cluster.local:5432/portfolio
  CORS_ORIGINS: https://abhibrdwaj.github.io
  VECTOR_BACKEND: pgvector
  CORPUS_VERSION: REPLACE_ME_GIT_SHA
  LANGFUSE_PUBLIC_KEY: REPLACE_ME
  LANGFUSE_SECRET_KEY: REPLACE_ME
```

- [ ] **Step 2: Write `deploy/k3s/api.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: portfolio-api
  namespace: portfolio
spec:
  selector:
    app: portfolio-api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio-api
  namespace: portfolio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: portfolio-api
  template:
    metadata:
      labels:
        app: portfolio-api
    spec:
      containers:
        - name: api
          image: ghcr.io/abhibrdwaj/portfolio-api:latest
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef:
                name: portfolio-api-credentials
          startupProbe:
            httpGet:
              path: /health
              port: 8080
            failureThreshold: 10
            periodSeconds: 3
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            failureThreshold: 3
            periodSeconds: 10
```

- [ ] **Step 3: Validate YAML syntax**

Run: `python3 -c "import yaml; [list(yaml.safe_load_all(open(f))) for f in ['deploy/k3s/api-secret.example.yaml', 'deploy/k3s/api.yaml']]"`
Expected: no output, exit code 0.

- [ ] **Step 4: Add the real (git-ignored) secret filename to `.gitignore`**

Add this line to the repository's root `.gitignore`: `deploy/k3s/api-secret.yaml`

- [ ] **Step 5: Commit**

```bash
git add deploy/k3s/api-secret.example.yaml deploy/k3s/api.yaml .gitignore
git commit -m "infra: add portfolio-api k3s Deployment/Service manifests"
```

---

### Task 9: Ingress, cert-manager ClusterIssuer, and ingest Job manifests

**Files:**
- Create: `deploy/k3s/cluster-issuer.yaml`
- Create: `deploy/k3s/ingress.yaml`
- Create: `deploy/k3s/ingest-job.yaml`

**Interfaces:** consumes `portfolio-api` Service (Task 8), `portfolio-api-credentials` Secret (Task 8). `REPLACE_ME_GIT_SHA` and the image tag in `ingest-job.yaml` are filled in at apply-time (manually in Task 11, or by CI's substitution step in Task 10) — this is the same deploy-time templating pattern as the `*-secret.example.yaml` files.

- [ ] **Step 1: Write `deploy/k3s/cluster-issuer.yaml`**

Fill in `REPLACE_ME_EMAIL` with a real email before applying (Let's Encrypt uses it only for certificate-expiry notices) — treat it the same as the other `REPLACE_ME` values: filled in on the applied copy, not committed with a real value.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: REPLACE_ME_EMAIL
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: traefik
```

- [ ] **Step 2: Write `deploy/k3s/ingress.yaml`**

`REPLACE_ME.duckdns.org` is filled in with the real DuckDNS hostname chosen in Task 11.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portfolio-api
  namespace: portfolio
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - REPLACE_ME.duckdns.org
      secretName: portfolio-api-tls
  rules:
    - host: REPLACE_ME.duckdns.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: portfolio-api
                port:
                  number: 80
```

- [ ] **Step 3: Write `deploy/k3s/ingest-job.yaml`**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: corpus-ingest
  namespace: portfolio
spec:
  ttlSecondsAfterFinished: 3600
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: ingest
          image: ghcr.io/abhibrdwaj/portfolio-api:latest
          command:
            - python
            - scripts/ingest_corpus.py
            - --corpus-version
            - REPLACE_ME_GIT_SHA
          envFrom:
            - secretRef:
                name: portfolio-api-credentials
```

- [ ] **Step 4: Validate YAML syntax**

Run: `python3 -c "import yaml; [list(yaml.safe_load_all(open(f))) for f in ['deploy/k3s/cluster-issuer.yaml', 'deploy/k3s/ingress.yaml', 'deploy/k3s/ingest-job.yaml']]"`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add deploy/k3s/cluster-issuer.yaml deploy/k3s/ingress.yaml deploy/k3s/ingest-job.yaml
git commit -m "infra: add Ingress, cert-manager ClusterIssuer, and corpus-ingest Job manifests"
```

---

### Task 10: CI/CD — build, push, and deploy on merge to `main`

**Files:**
- Modify: `.github/workflows/api-tests.yml`

**Interfaces:** consumes `deploy/k3s/*.yaml` (Tasks 7-9), GitHub secrets `ORACLE_VM_HOST`, `ORACLE_VM_USER`, `ORACLE_VM_SSH_KEY` (created by the user in Task 11, not by this task).

- [ ] **Step 1: Append the new job**

Add this job to `.github/workflows/api-tests.yml`, at the same indentation level as the existing `pytest` job (i.e. under `jobs:`):

```yaml
  build-and-deploy:
    needs: pytest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Set short SHA
        id: vars
        run: echo "sha_short=$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: api
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/portfolio-api:${{ steps.vars.outputs.sha_short }}
            ghcr.io/${{ github.repository_owner }}/portfolio-api:latest

      - name: Sync k8s manifests to the VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.ORACLE_VM_HOST }}
          username: ${{ secrets.ORACLE_VM_USER }}
          key: ${{ secrets.ORACLE_VM_SSH_KEY }}
          source: "deploy/k3s/*"
          target: "/opt/portfolio/deploy/k3s"

      - name: Roll out the new image
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.ORACLE_VM_HOST }}
          username: ${{ secrets.ORACLE_VM_USER }}
          key: ${{ secrets.ORACLE_VM_SSH_KEY }}
          script: |
            kubectl set image deployment/portfolio-api api=ghcr.io/${{ github.repository_owner }}/portfolio-api:${{ steps.vars.outputs.sha_short }} -n portfolio
            kubectl rollout status deployment/portfolio-api -n portfolio --timeout=120s

      - name: Check if corpus changed
        id: corpus
        run: |
          if git diff --name-only ${{ github.event.before }} ${{ github.sha }} -- api/corpus | grep -q .; then
            echo "changed=true" >> "$GITHUB_OUTPUT"
          else
            echo "changed=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Re-run corpus ingest
        if: steps.corpus.outputs.changed == 'true'
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.ORACLE_VM_HOST }}
          username: ${{ secrets.ORACLE_VM_USER }}
          key: ${{ secrets.ORACLE_VM_SSH_KEY }}
          script: |
            kubectl delete job corpus-ingest -n portfolio --ignore-not-found
            sed -e 's|REPLACE_ME_GIT_SHA|${{ steps.vars.outputs.sha_short }}|' \
                -e 's|ghcr.io/abhibrdwaj/portfolio-api:latest|ghcr.io/${{ github.repository_owner }}/portfolio-api:${{ steps.vars.outputs.sha_short }}|' \
                /opt/portfolio/deploy/k3s/ingest-job.yaml | kubectl apply -f -
            kubectl wait --for=condition=complete job/corpus-ingest -n portfolio --timeout=300s
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; list(yaml.safe_load_all(open('.github/workflows/api-tests.yml')))"`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/api-tests.yml
git commit -m "ci: build, push, and deploy portfolio-api on merge to main"
```

Real end-to-end verification of this job happens on the first push to `main` after Task 11's VM and secrets exist — it can't run in this sandbox (no VM, no GitHub secrets configured yet).

---

### Task 11: Manual rollout runbook (ops — not TDD; run by hand, not by an agent)

**Files:**
- Create: `deploy/k3s/RUNBOOK.md`

**Interfaces:** none — this is operator documentation, not code. Everything here requires the user's own Oracle Cloud account, DuckDNS account, GitHub repo settings access, and SSH access, none of which this environment has. Write the file, then the user executes it by hand.

- [ ] **Step 1: Write `deploy/k3s/RUNBOOK.md`**

```markdown
# Rollout Runbook: portfolio-api on Oracle Cloud k3s

One-time setup steps to take `api/` from merged code to a live HTTPS endpoint.
Run these yourself — they need your Oracle Cloud, DuckDNS, and GitHub
accounts, which nothing else in this repo has access to.

## 1. Provision the VM

- Oracle Cloud Console -> Compute -> Instances -> Create Instance.
- Shape: `VM.Standard.A1.Flex` (Ampere ARM), Always Free eligible. 2 OCPU / 12GB is
  plenty for this workload; you can go up to 4 OCPU / 24GB, still free.
- Image: Ubuntu 22.04 (ARM).
- Networking: attach a reserved **public IPv4** (free, static).
- In the VM's attached Security List (or Network Security Group), allow
  ingress on **22** (SSH), **80**, and **443** from `0.0.0.0/0`. Oracle has
  two layers here (the VCN Security List *and* the instance's own iptables
  via `netfilter-persistent` on the image) -- if you can SSH in but 80/443
  don't respond later, check both.

## 2. Install k3s

SSH into the VM, then:

```bash
curl -sfL https://get.k3s.io | sh -
sudo cat /etc/rancher/k3s/k3s.yaml
```

Copy that kubeconfig to your local machine (or keep using it over SSH),
pointing its `server:` field at the VM's public IP instead of `127.0.0.1`.
Confirm access:

```bash
kubectl get nodes
```

## 3. Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml
kubectl -n cert-manager wait --for=condition=Available deployment --all --timeout=180s
```

## 4. Set up DuckDNS

- Sign in at https://www.duckdns.org, create a subdomain (e.g.
  `abhinav-portfolio`), and point it at the VM's static public IP.
- Because the IP is static (not the usual DuckDNS dynamic-IP case), this is
  a one-time setting, not a running updater.
- Your API's hostname is now `abhinav-portfolio.duckdns.org` (substitute
  your actual chosen name everywhere below).

## 5. Clone the repo onto the VM

```bash
sudo mkdir -p /opt/portfolio && sudo chown $USER:$USER /opt/portfolio
git clone https://github.com/abhibrdwaj/personal-portfolio.git /opt/portfolio
cd /opt/portfolio
```

## 6. Fill in the real secrets and hostnames (none of this is committed)

```bash
cp deploy/k3s/postgres-secret.example.yaml deploy/k3s/postgres-secret.yaml
cp deploy/k3s/api-secret.example.yaml deploy/k3s/api-secret.yaml
```

Edit both copies: put a real Postgres password in `postgres-secret.yaml`
(and match it in `api-secret.yaml`'s `DATABASE_URL`), your real
`OPENAI_API_KEY`, your Langfuse keys (sign up free at
https://cloud.langfuse.com if you haven't), and set `CORPUS_VERSION` to the
current `git rev-parse --short HEAD`.

Edit `deploy/k3s/cluster-issuer.yaml`: replace `REPLACE_ME_EMAIL` with your
real email.

Edit `deploy/k3s/ingress.yaml`: replace both `REPLACE_ME.duckdns.org` with
your real DuckDNS hostname from step 4.

## 7. Apply the namespace, Postgres, and schema

```bash
kubectl apply -f deploy/k3s/namespace.yaml
kubectl apply -f deploy/k3s/postgres-secret.yaml
kubectl apply -f deploy/k3s/postgres.yaml
kubectl -n portfolio wait --for=condition=Ready pod -l app=postgres --timeout=180s

kubectl -n portfolio cp api/db/schema.sql postgres-0:/tmp/schema.sql
kubectl -n portfolio exec postgres-0 -- psql -U portfolio -d portfolio -f /tmp/schema.sql
```

## 8. Build and push the first image

Easiest: push this branch's commits to `main` once (after Task 10's CI
workflow is merged) -- CI builds and pushes
`ghcr.io/abhibrdwaj/portfolio-api:<sha>` automatically. Note the short SHA
it used; you'll need it below.

## 9. Apply cert-manager's issuer, the API, and the Ingress

```bash
kubectl apply -f deploy/k3s/cluster-issuer.yaml
kubectl apply -f deploy/k3s/api-secret.yaml

sed "s|ghcr.io/abhibrdwaj/portfolio-api:latest|ghcr.io/abhibrdwaj/portfolio-api:<sha-from-step-8>|" \
  deploy/k3s/api.yaml | kubectl apply -f -

kubectl apply -f deploy/k3s/ingress.yaml
kubectl -n portfolio rollout status deployment/portfolio-api --timeout=120s
```

## 10. Seed Postgres with the corpus

```bash
sed -e "s|REPLACE_ME_GIT_SHA|<sha-from-step-8>|" \
    -e "s|ghcr.io/abhibrdwaj/portfolio-api:latest|ghcr.io/abhibrdwaj/portfolio-api:<sha-from-step-8>|" \
    deploy/k3s/ingest-job.yaml | kubectl apply -f -
kubectl -n portfolio wait --for=condition=complete job/corpus-ingest --timeout=300s
kubectl -n portfolio logs job/corpus-ingest
```

Expect a line like `Ingested <N> chunks at corpus_version=<sha>`.

## 11. Verify

```bash
curl -sS https://abhinav-portfolio.duckdns.org/health
curl -sS https://abhinav-portfolio.duckdns.org/v1/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"What is your experience at Kidture Health?"}]}'
```

Expect `{"status":"ok"}` from the first call and a real grounded reply with
citations from the second.

## 12. Wire up CI for future deploys

In the GitHub repo's Settings -> Secrets and variables -> Actions, add:

- `ORACLE_VM_HOST` — the VM's public IP.
- `ORACLE_VM_USER` — the SSH user (e.g. `ubuntu`).
- `ORACLE_VM_SSH_KEY` — the private key matching a public key already
  authorized on the VM (`~/.ssh/authorized_keys`), with permission to run
  `kubectl` (either the VM's default user, or one you've given a copy of
  `/etc/rancher/k3s/k3s.yaml` with the right ownership).

From here, every push to `main` that changes `api/**` builds, pushes, and
rolls out automatically, re-running the corpus ingest whenever
`api/corpus/**` changed in that push.

## 13. Point the frontend at the new API

Create `.env.production` at the repo root (this is not secret, just the
public API URL, so it's fine to commit):

```
VITE_API_BASE_URL=https://abhinav-portfolio.duckdns.org
```

Then:

```bash
npm run deploy
```

This rebuilds the frontend with the production API URL baked in and
publishes it to GitHub Pages via `gh-pages`.
```

- [ ] **Step 2: Commit**

```bash
git add deploy/k3s/RUNBOOK.md
git commit -m "docs: add k3s Oracle Cloud rollout runbook"
```

---

## Self-Review

**Spec coverage:**
- Cluster layout (Oracle VM, k3s, Traefik, local-path) → Task 11 (provisioning) + Task 7/8 (manifests that rely on the `local-path` StorageClass and Traefik `ingressClassName`).
- Workloads (Postgres StatefulSet, API Deployment, Ingress, ingest Job) → Tasks 7, 8, 9.
- Data flow change (retrieval backend swap, corpus embedding moved out of boot) → Tasks 1, 2, 3, 4, 5.
- Networking/TLS/DNS (DuckDNS, cert-manager, firewall) → Task 9 (manifests) + Task 11 (DNS/firewall steps, since those are account-level actions no manifest can express).
- CI/CD → Task 10.
- Security (`CORS_ORIGINS` locked to the GitHub Pages origin, secrets never committed) → Task 8 (`api-secret.example.yaml`) + Task 11 (real secret files git-ignored, filled in by hand).
- Observability (Langfuse) → Task 11 step 6 (real keys added to the secret).
- Rollout plan and cost summary from the spec → fully realized by Task 11 and the Global Constraints section; no separate task needed since the spec's cost claims are about infrastructure choice (already locked in by Tasks 7-9's manifests targeting free-tier-compatible resources), not code to write.

**Placeholder scan:** The only `REPLACE_ME`-style strings left are deploy-time values (real passwords, API keys, email, DuckDNS hostname, git SHA) that cannot exist until the user's actual Oracle/DuckDNS/GitHub accounts exist — each one has an exact filled-in example in Task 11's runbook, so none of them are unresolved ambiguity.

**Type/interface consistency:** `RetrievedChunk(chunk_id, title, kind, text, score)` (defined in `app/retrieval/retrieve.py`, unchanged) is what both `InMemoryRetrievalBackend` (Task 1) and `PgVectorRetrievalBackend` (Task 3) return. `RetrievalBackend.retrieve(query_embedding, *, top_k, min_score, allowed_kinds)` matches the call sites in `chat.py` and `jd_fit.py` (Task 1, steps 7-8) exactly. `CorpusChunkRow` (Task 4) fields (`chunk_id, title, kind, text, source_file, embed_input`) are consumed identically by `load_vector_index` (Task 4) and `ingest_corpus.py` (Task 5).

**Scope check:** This plan is one cohesive deployment effort. Tasks 1-6 are fully agent-executable TDD work with no external dependencies. Tasks 7-10 are file-writing tasks validated by YAML syntax checks (no cluster exists yet to `kubectl apply` against). Task 11 is explicitly ops work requiring the user's own cloud/DNS/GitHub accounts — it is not decomposed into TDD steps because there is nothing here to unit test; it's a sequence of real commands run against real infrastructure that doesn't exist until the user creates it.

---

Plan complete and saved to `docs/superpowers/plans/2026-09-02-k3s-oracle-rag-deploy.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
