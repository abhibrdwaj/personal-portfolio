# Portfolio Chat + JD Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a FastAPI backend that serves RAG-grounded chat (`POST /v1/chat`) and structured JD fit (`POST /v1/jd-fit`), wired to the existing Vite/React chat UI, with observability hooks aligned to `docs/superpowers/specs/2026-05-02-chat-jd-fit-design.md`.

**Architecture:** Python BFF holds all secrets. Profile content lives as versioned Markdown under `api/corpus/` (or sibling path); at startup or via a CLI ingest step the service chunks text, embeds with the chosen provider, and stores vectors in-process for P0 (upgrade path: persistent vector DB). Chat builds prompts from system instructions + top-k chunks + bounded recent turns. JD fit runs extraction JSON → per-requirement retrieval → structured report JSON validated by Pydantic. Tracing uses a thin wrapper; **Langfuse** is the default trace backend recommendation for v1 to minimize framework lock-in—swap to LangSmith if you adopt LangChain/LangGraph later.

**Tech Stack:** FastAPI, Uvicorn, Pydantic v2, `httpx` (LLM HTTP), OpenAI-compatible embeddings/chat (abstract behind `LLMClient`), NumPy cosine similarity for P0 in-memory index, pytest + httpx ASGI client for API tests, Vite `import.meta.env.VITE_API_BASE_URL` on the frontend.

---

## File map (created or modified)

| Path | Responsibility |
|------|----------------|
| `api/pyproject.toml` or `api/requirements.txt` | Python deps and optional `[project.scripts]` for ingest |
| `api/app/main.py` | FastAPI app factory, CORS, routers, lifespan (load index) |
| `api/app/config.py` | Env-loaded settings (`OPENAI_API_KEY`, `CORPUS_VERSION`, `PROMPT_VERSION`, CORS origins, rate limits, Langfuse keys optional) |
| `api/app/models.py` | Pydantic request/response models matching §5 of the design spec |
| `api/app/rate_limit.py` | Simple IP/token-bucket or sliding window (depends on host; in-memory for single instance) |
| `api/app/retrieval/chunker.py` | Deterministic chunking (character/token approximation) |
| `api/app/retrieval/embeddings.py` | Embed batch + query embedding via `LLMClient` |
| `api/app/retrieval/index.py` | In-memory matrix + id lookup for P0 |
| `api/app/retrieval/retrieve.py` | `top_k` with score threshold from §7 |
| `api/app/llm/client.py` | Protocol/class: `complete`, `embed` |
| `api/app/prompts/chat.py` | System prompt (first-person Abhinav), user template with citations instructions |
| `api/app/prompts/jd_fit.py` | Requirement extraction + report composition prompts |
| `api/app/handlers/chat.py` | Orchestrate retrieve → prompt_build → llm |
| `api/app/handlers/jd_fit.py` | extract_requirements → retrieve_per_cluster → compose_report |
| `api/app/observability/trace.py` | `request_id`, optional Langfuse spans, metadata tags (`corpus_version`, `prompt_version`, `environment`) |
| `api/corpus/**/*.md` | Source-of-truth profile text (start with `experience.md`, expand later) |
| `api/tests/test_health.py`, `api/tests/test_chat.py`, … | pytest |
| `src/lib/api.ts` (or `src/services/portfolioApi.ts`) | Typed fetch helpers for `/v1/chat`, `/v1/jd-fit` |
| `src/vite-env.d.ts` | `ImportMetaEnv` for `VITE_API_BASE_URL` |
| `src/components/Chatbot.tsx` | Replace mock path; optional JD panel; citations UX |
| `.env.example` (repo root and/or `api/.env.example`) | Document vars (no secrets) |

---

## Resolved decisions (recorded here)

| Topic | Choice for v1 implementation |
|-------|-------------------------------|
| Vector store | **In-memory NumPy index** loaded at startup from embedded corpus (P0–P1); document migration to Chroma/pgvector when traffic or persistence requires |
| LLM provider | **OpenAI** via official SDK or HTTPS (`gpt-4o-mini` or similar for dev cost control); single interface class for Anthropic swap |
| Trace backend | **Langfuse** optional behind env (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`); structured JSON logs always on |
| Deploy target | **Render** or **Railway** (single Web service); alternatives noted in Task 9 |
| CORS | Allow explicit GitHub Pages origin(s): `https://<user>.github.io` and local dev |

---

### Task 1: Python package scaffold and `/health`

**Files:**
- Create: `api/pyproject.toml`
- Create: `api/app/__init__.py`
- Create: `api/app/main.py`
- Create: `api/tests/test_health.py`

- [ ] **Step 1: Add minimal pyproject with runtime and dev deps**

```toml
[project]
name = "portfolio-api"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic>=2.0",
  "pydantic-settings>=2.0",
  "httpx>=0.27.0",
  "numpy>=1.26.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-asyncio>=0.24.0"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 2: Write failing test for `/health`**

Create `api/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Run test — expect failure**

Run from repo root:

```bash
cd api && python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]" && pytest tests/test_health.py -v
```

Expected: **FAIL** (import error or no `/health` route).

- [ ] **Step 4: Minimal FastAPI app with `/health`**

Create `api/app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="Portfolio API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Run test — expect pass**

```bash
cd api && source .venv/bin/activate && pytest tests/test_health.py -v
```

Expected: **PASS**

- [ ] **Step 6: Commit**

```bash
git add api/pyproject.toml api/app/main.py api/tests/test_health.py
git commit -m "feat(api): add FastAPI scaffold and health endpoint"
```

---

### Task 2: Settings module (env-based configuration)

**Files:**
- Create: `api/app/config.py`
- Modify: `api/pyproject.toml` (add `pydantic-settings` already listed)
- Create: `api/.env.example`

- [ ] **Step 1: Add `.env.example` documenting server and LLM vars**

```bash
# api/.env.example
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
CORS_ORIGINS=https://youruser.github.io,http://127.0.0.1:5173
CORPUS_VERSION=local-dev
PROMPT_VERSION=chat-v1
ENVIRONMENT=dev
# Optional Langfuse
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

- [ ] **Step 2: Implement `Settings` with `pydantic_settings.BaseSettings`**

Create `api/app/config.py`:

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_chat_model: str = Field(default="gpt-4o-mini", alias="OPENAI_CHAT_MODEL")
    openai_embed_model: str = Field(default="text-embedding-3-small", alias="OPENAI_EMBED_MODEL")
    cors_origins: str = Field(
        default="http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
        description="Comma-separated list",
    )
    corpus_version: str = Field(default="unknown", alias="CORPUS_VERSION")
    prompt_version: str = Field(default="chat-v1", alias="PROMPT_VERSION")
    environment: str = Field(default="dev", alias="ENVIRONMENT")
    langfuse_public_key: str = Field(default="", alias="LANGFUSE_PUBLIC_KEY")
    langfuse_secret_key: str = Field(default="", alias="LANGFUSE_SECRET_KEY")
    langfuse_host: str = Field(default="https://cloud.langfuse.com", alias="LANGFUSE_HOST")

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 3: Wire `lifespan` placeholder (empty) if needed — skip until Task 4**

No test required until CORS wired in Task 7.

- [ ] **Step 4: Commit**

```bash
git add api/app/config.py api/.env.example
git commit -m "feat(api): add settings module and env example"
```

---

### Task 3: Corpus Markdown and deterministic chunker

**Files:**
- Create: `api/corpus/experience.md` (seed from your real resume bullets; placeholder content must be replaced with your facts before prod)
- Create: `api/app/retrieval/chunker.py`
- Create: `api/tests/test_chunker.py`

- [ ] **Step 1: Write failing test for chunk boundaries**

```python
from app.retrieval.chunker import chunk_text


def test_chunker_splits_on_paragraphs():
    text = "A\n\nB\n\nC"
    chunks = chunk_text(text, max_chars=4)
    assert len(chunks) >= 2
    assert all(len(c) <= 6 for c in chunks)
```

- [ ] **Step 2: Run pytest — expect FAIL**

```bash
cd api && pytest tests/test_chunker.py -v
```

- [ ] **Step 3: Implement `chunk_text`**

```python
def chunk_text(text: str, max_chars: int = 1200) -> list[str]:
    normalized = text.strip()
    if not normalized:
        return []
    paragraphs = [p.strip() for p in normalized.split("\n\n") if p.strip()]
    chunks: list[str] = []
    buffer = ""
    for p in paragraphs:
        if len(buffer) + len(p) + 2 <= max_chars:
            buffer = f"{buffer}\n\n{p}" if buffer else p
            continue
        if buffer:
            chunks.append(buffer)
        if len(p) <= max_chars:
            buffer = p
        else:
            for i in range(0, len(p), max_chars):
                chunks.append(p[i : i + max_chars])
            buffer = ""
    if buffer:
        chunks.append(buffer)
    return chunks
```

- [ ] **Step 4: Run pytest — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add api/corpus/experience.md api/app/retrieval/chunker.py api/tests/test_chunker.py
git commit -m "feat(api): add profile corpus stub and text chunker"
```

---

### Task 4: LLM client (embed + chat completions)

**Files:**
- Create: `api/app/llm/client.py`
- Create: `api/tests/test_llm_client_mock.py` (mock transport with `httpx.MockTransport` or `unittest.mock`)

- [ ] **Step 1: Define protocol and OpenAI implementation**

`api/app/llm/client.py` core surface:

```python
from typing import Protocol, Sequence

import httpx


class LLMClient(Protocol):
    async def embed(self, texts: Sequence[str]) -> list[list[float]]: ...
    async def complete(self, system: str, user: str) -> str: ...


class OpenAILLMClient:
    def __init__(self, api_key: str, chat_model: str, embed_model: str) -> None:
        self._key = api_key
        self._chat_model = chat_model
        self._embed_model = embed_model
        self._http = httpx.AsyncClient(
            base_url="https://api.openai.com/v1",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0,
        )

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        response = await self._http.post(
            "/embeddings",
            json={"model": self._embed_model, "input": list(texts)},
        )
        response.raise_for_status()
        data = response.json()["data"]
        return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]

    async def complete(self, system: str, user: str) -> str:
        response = await self._http.post(
            "/chat/completions",
            json={
                "model": self._chat_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
```

- [ ] **Step 2: Test with mocked JSON responses (no real API key)**

Use `httpx.MockTransport` to return fixture JSON for `/embeddings` and `/chat/completions`.

- [ ] **Step 3: Commit**

```bash
git add api/app/llm/client.py api/tests/test_llm_client_mock.py
git commit -m "feat(api): add OpenAI-compatible async LLM client"
```

---

### Task 5: In-memory vector index and retrieve

**Files:**
- Create: `api/app/retrieval/index.py`
- Create: `api/app/retrieval/retrieve.py`
- Create: `api/tests/test_retrieve.py`

- [ ] **Step 1: Implement cosine top-k**

Use NumPy: normalize rows, dot product as similarity.

```python
import numpy as np


def top_k_indices(query: list[float], matrix: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
    q = np.array(query, dtype=np.float64)
    q = q / np.linalg.norm(q)
    sims = matrix @ q
    k = min(k, sims.shape[0])
    idx = np.argpartition(-sims, kth=k - 1)[:k]
    idx = idx[np.argsort(-sims[idx])]
    return idx, sims[idx]
```

- [ ] **Step 2: Test retrieve returns ordered results with dummy vectors**

- [ ] **Step 3: Commit**

```bash
git add api/app/retrieval/index.py api/app/retrieval/retrieve.py api/tests/test_retrieve.py
git commit -m "feat(api): add in-memory cosine retrieval"
```

---

### Task 6: Load corpus, embed at startup, build index

**Files:**
- Create: `api/app/corpus_loader.py`
- Modify: `api/app/main.py` (lifespan)

- [ ] **Step 1: On startup, glob `api/corpus/**/*.md`, chunk, embed, assign chunk ids `"{file_stem}-{i}"`**

Store parallel lists: `chunk_ids`, `chunk_meta` (title from filename), `embedding_matrix`.

- [ ] **Step 2: Fail fast if `OPENAI_API_KEY` missing in non-test env**

For pytest, inject a fake client or set `PYTEST_CURRENT_TEST` check—prefer dependency overrides in tests:

```python
from fastapi.testclient import TestClient

app.dependency_overrides[get_llm_client] = lambda: FakeLLMClient()
```

- [ ] **Step 3: Commit**

```bash
git add api/app/corpus_loader.py api/app/main.py
git commit -m "feat(api): embed corpus at startup into in-memory index"
```

---

### Task 7: `POST /v1/chat` handler (RAG)

**Files:**
- Create: `api/app/models.py`
- Create: `api/app/prompts/chat.py`
- Create: `api/app/handlers/chat.py`
- Modify: `api/app/main.py` (include router)
- Create: `api/tests/test_chat_api.py`

- [ ] **Step 1: Pydantic models matching design §5**

```python
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    session_id: str | None = None


class Citation(BaseModel):
    chunk_id: str
    title: str


class ChatResponse(BaseModel):
    reply: str
    citations: list[Citation] = []
```

- [ ] **Step 2: System prompt** — enforce first-person, cite only from retrieved chunks, abstain if empty/low score.

- [ ] **Step 3: Integration test** with dependency overrides (fake retrieval + fake LLM returning `"ok"`).

- [ ] **Step 4: Commit**

```bash
git add api/app/models.py api/app/prompts/chat.py api/app/handlers/chat.py api/tests/test_chat_api.py api/app/main.py
git commit -m "feat(api): implement POST /v1/chat with RAG prompt"
```

---

### Task 8: CORS, payload limits, rate limiting, request id

**Files:**
- Modify: `api/app/main.py`
- Create: `api/app/rate_limit.py`
- Create: `api/app/middleware/request_id.py` (or inline middleware)

- [ ] **Step 1: `CORSMiddleware` with `allow_origins=settings.cors_origin_list()`, `allow_methods=["POST","GET","OPTIONS"]`**

- [ ] **Step 2: In-memory rate limit: e.g. 30 requests/minute per IP for `/v1/*`**

Return `429` with JSON `{"detail":"rate_limit_exceeded"}` per design §5.

- [ ] **Step 3: Add `X-Request-ID` header propagation**

- [ ] **Step 4: Commit**

```bash
git add api/app/main.py api/app/rate_limit.py
git commit -m "feat(api): add CORS, rate limit, and request id middleware"
```

---

### Task 9: Observability shim (structured logs + optional Langfuse)

**Files:**
- Create: `api/app/observability/trace.py`

- [ ] **Step 1: Log JSON lines:** `request_id`, route name, `corpus_version`, `prompt_version`, duration_ms, token counts if available.

- [ ] **Step 2: If Langfuse keys present, POST trace events per §11 span names** (`http`, `retrieve`, `prompt_build`, `llm`). If absent, no-op.

- [ ] **Step 3: Commit**

```bash
git add api/app/observability/trace.py
git commit -m "feat(api): add structured logging and optional Langfuse traces"
```

---

### Task 10: Frontend API client and env

**Files:**
- Create: `src/lib/portfolioApi.ts`
- Modify: `src/vite-env.d.ts`
- Create: `.env.example` (repo root)

- [ ] **Step 1: Declare env**

`src/vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 2: Implement `postChat` / types**

```typescript
export type ChatRole = 'user' | 'assistant'

export type ChatMessagePayload = { role: ChatRole; content: string }

export type ChatResponsePayload = {
  reply: string
  citations: { chunk_id: string; title: string }[]
}

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''

export const postChat = async (
  messages: ChatMessagePayload[],
  sessionId?: string
): Promise<ChatResponsePayload> => {
  const response = await fetch(`${baseUrl}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, session_id: sessionId }),
  })
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }
  return response.json() as Promise<ChatResponsePayload>
}
```

- [ ] **Step 3: `.env.example` at repo root**

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/portfolioApi.ts src/vite-env.d.ts .env.example
git commit -m "feat(web): add portfolio API client and Vite env typing"
```

---

### Task 11: Replace mock chat path in `Chatbot.tsx`

**Files:**
- Modify: `src/components/Chatbot.tsx`

- [ ] **Step 1: Remove `mockResponses` / `getBotResponse` / `setTimeout` simulation.**

- [ ] **Step 2: On send:** append user message; set typing; call `postChat` with history mapped to `{ role, content }` (only user+assistant turns, cap last ~10 exchanges for token budget per design §3).

- [ ] **Step 3: Error UX:** friendly message on failure; single retry optional for network errors.

- [ ] **Step 4: Citations:** render collapsible “Sources” under bot messages when `citations.length > 0`.

- [ ] **Step 5: `session_id`:** `useEffect` + `crypto.randomUUID()` in `sessionStorage` or `localStorage` once.

- [ ] **Step 6: Commit**

```bash
git add src/components/Chatbot.tsx
git commit -m "feat(web): wire chatbot to backend API with citations"
```

---

### Task 12: Deploy backend (P0)

**Files:**
- Create: `api/README.md` (run instructions)
- Optional: `render.yaml` or `railway.json` if using those platforms

- [ ] **Step 1: Document run command**

```bash
cd api && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 2: Set env vars on host:** `OPENAI_API_KEY`, `CORS_ORIGINS=https://<user>.github.io`, `CORPUS_VERSION=<git-sha>`, `ENVIRONMENT=prod`.

- [ ] **Step 3: Smoke test:** `curl https://<api-host>/health` and `POST /v1/chat` with minimal body.

- [ ] **Step 4: Commit**

```bash
git add api/README.md
git commit -m "docs(api): document deployment and runtime commands"
```

---

### Task 13: `POST /v1/jd-fit` (P2)

**Files:**
- Extend: `api/app/models.py`
- Create: `api/app/handlers/jd_fit.py`
- Create: `api/app/prompts/jd_fit.py`
- Create: `api/tests/test_jd_fit_api.py`
- Modify: `src/components/Chatbot.tsx` or new panel component
- Extend: `src/lib/portfolioApi.ts`

- [ ] **Step 1: Request/response models per design §5**

```python
class JdFitRequest(BaseModel):
    jd_text: str = Field(min_length=50, max_length=24000)


class MatchRow(BaseModel):
    requirement: str
    fit: str = Field(pattern="^(strong|partial|gap|unknown)$")
    rationale: str
    source_chunk_ids: list[str]


class JdFitResponse(BaseModel):
    summary: str
    match_rows: list[MatchRow]
    disclaimers: list[str]
```

- [ ] **Step 2: Handler pipeline:** normalize JD → LLM JSON schema for requirements → for each requirement retrieve top chunks → LLM compose `JdFitResponse` → validate with Pydantic.

- [ ] **Step 3: Default disclaimers list including informational-not-hiring-decision language.

- [ ] **Step 4: Frontend:** textarea + “Analyze fit” button; render table of rows + summary.

- [ ] **Step 5: Commit**

```bash
git add api/app/handlers/jd_fit.py api/tests/test_jd_fit_api.py src/lib/portfolioApi.ts src/components/Chatbot.tsx
git commit -m "feat: add JD fit endpoint and UI"
```

---

### Task 14: Golden questions and CI regression (P3)

**Files:**
- Create: `api/tests/fixtures/golden_chat.jsonl` (question + expected chunk_id hints)
- Create: `api/scripts/run_golden.py` (optional, exits non-zero on regression)

- [ ] **Step 1: Store 5–10 labeled retrieval cases**; script asserts retrieved ids intersect expected.

- [ ] **Step 2: Add GitHub Action workflow** running `pytest` on PRs (no live OpenAI: use mocks or `CI=true` stub client).

- [ ] **Step 3: Commit**

```bash
git add api/tests/fixtures/golden_chat.jsonl api/scripts/run_golden.py .github/workflows/api-tests.yml
git commit -m "ci: add golden retrieval fixtures and API test workflow"
```

---

## Self-review

**1. Spec coverage**

| Spec section | Tasks |
|--------------|-------|
| §2 Architecture (BFF, static frontend) | Tasks 10–12 |
| §3 Components (corpus, ingestion, retriever, chat, JD, observability) | Tasks 3–9, 13 |
| §4 Data flow chat | Task 7 |
| §4 Data flow JD | Task 13 |
| §5 API contracts | Tasks 7, 13 |
| §6 Security (rate limit, max body, no raw JD in logs) | Tasks 8, 9 (hash/truncate in trace module) |
| §7 Error handling | Tasks 7, 11 |
| §8 Phased rollout P0–P3 | Tasks 1–12 P0; Task 9 P1 observability; Task 13 P2; Task 14 P3 |
| §9 Testing | Tasks 1–7, 13–14 |
| §11 Observability | Task 9 |
| §12 Chatbot.tsx | Task 11 |

**2. Placeholder scan:** No `TBD`/`TODO` in planned code blocks; `experience.md` content must be replaced with real profile text before production (explicit in Task 3).

**3. Type consistency:** `ChatResponse`, `Citation`, `JdFitResponse`, and frontend `ChatResponsePayload` field names aligned (`chunk_id`, `title`, `match_rows`, `disclaimers`).

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-02-chat-jd-fit.md`. Two execution options:**

**1. Subagent-driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. **Required sub-skill:** superpowers:subagent-driven-development.

**2. Inline execution** — Execute tasks in this session using executing-plans with checkpoints. **Required sub-skill:** superpowers:executing-plans.

**Which approach do you want for implementation?**
