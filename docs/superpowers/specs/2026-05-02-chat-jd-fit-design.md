# Design: Portfolio Chat + Job Description (JD) Fit

**Date:** 2026-05-02  
**Status:** Draft for implementation planning  
**Scope:** Replace mock chat with RAG-grounded answers; add structured “role fit” analysis from pasted JDs. Voice / TTS explicitly out of scope.

## 1. Goals and audiences

**Primary goals**

- Answer questions about the portfolio owner in a natural voice defined in the system prompt: **v1 default** is a knowledgeable assistant speaking **in first person** as Abhinav (answers use "I", "my", "me"), grounded in curated profile content.
- Let recruiters and hiring managers paste a job description and receive a structured match report: strengths, gaps, and evidence tied to retrieved profile chunks (reverse of typical resume-to-JD board matching).

**Audiences**

- **Tech peers:** Deep-dive questions, stack, architecture, trade-offs; expect concise, accurate answers with optional “go deeper” follow-ups.
- **Recruiters / hiring managers:** Role titles, scope, impact numbers, location/work authorization if present in corpus; JD flow should feel like a lightweight screening output, not a black box.

**Non-goals (this phase)**

- Voice agents, real-time streaming TTS, phone-screen simulation.
- User accounts, saved conversations, or multi-tenant data.
- Fully autonomous agents with unbounded tool loops or external browsing.

## 2. Architecture

**High level**

- **Frontend:** Existing Vite + React + TypeScript site on GitHub Pages. No secrets in the client. Chat UI (`src/components/Chatbot.tsx`) calls a small HTTP API.
- **Backend:** Python service (FastAPI recommended) hosted on a serverless or lightweight host (e.g. Vercel/Netlify/Railway/Cloud Run—deployment choice is an implementation detail; the contract is HTTPS JSON APIs).
- **Knowledge base:** Versioned documents (Markdown/JSON) in the repo or backend bundle, chunked and embedded offline or at deploy time into a vector store (hosted DB or embedded store depending on host constraints).
- **LLM:** One provider (e.g. OpenAI, Anthropic) behind the backend; API keys only on the server.

**Rationale**

- Static hosting cannot hold LLM keys safely. A thin BFF (backend-for-frontend) keeps keys server-side and allows rate limiting, logging, and prompt versioning.

```mermaid
flowchart LR
  subgraph client [GitHub Pages]
    UI[Chatbot + JD panel]
  end
  subgraph api [Python API]
    Chat["POST /v1/chat"]
    JD["POST /v1/jd-fit"]
    RAG[RAG retrieve]
    LLM[LLM completion]
  end
  subgraph data [Data]
    Docs[Profile chunks + embeddings]
  end
  UI --> Chat
  UI --> JD
  Chat --> RAG
  JD --> RAG
  RAG --> Docs
  Chat --> LLM
  JD --> LLM
```

## 3. Components and responsibilities

| Unit | Responsibility | Depends on |
|------|----------------|------------|
| **Profile corpus** | Source of truth text: experience, projects, education, skills, awards (phase in over time). | Editor (human), git |
| **Ingestion pipeline** | Chunk, embed, upsert vectors; idempotent; version tied to git SHA or content hash. | Embedding model API, vector store |
| **Retriever** | Given query (chat message or JD-derived queries), return top-k chunks with scores and metadata (section, dates). | Vector store |
| **Chat handler** | Build prompt: system instructions + retrieved chunks + recent message history (bounded token budget) → LLM → assistant message. | Retriever, LLM |
| **JD fit handler** | (1) Parse/normalize JD text. (2) Extract structured requirements (LLM with schema or tool output). (3) Retrieve evidence per requirement cluster. (4) Produce structured report (match, partial, gap) with citations to chunk ids. | Retriever, LLM |
| **Optional router** | Single LLM call with **bounded** tool use: e.g. `search_profile`, `analyze_jd`—only if simple keyword routing is insufficient. | Same as tools |
| **Frontend Chatbot** | Modes: open chat; JD paste + “Analyze fit.” Display citations lightly (e.g. “Sources: Experience — Freshworks”). | Public API base URL env |
| **Observability** | Request ids, distributed traces (retrieve → LLM spans), eval datasets, dashboards; redacts sensitive payloads per §6 / §11. | Host logs + trace backend (e.g. LangSmith or Langfuse) |

## 4. Data flow

### 4.1 Open chat

1. User sends message from `Chatbot`.
2. Frontend `POST /v1/chat` with `{ messages: [...], session_id? }` (session id optional uuid in localStorage for correlation only).
3. Backend runs retrieval on the latest user utterance (or a hypothetical standalone query reformulation step if needed later).
4. Backend composes prompt with retrieved chunks and calls LLM once (or bounded multi-step if using tools).
5. Response: `{ reply: string, citations?: [{ label: string, chunk_id: string }] }`.
6. UI renders reply; optional expandable citations.

### 4.2 JD fit

1. User pastes JD and submits.
2. Frontend `POST /v1/jd-fit` with `{ jd_text: string, locale?: string }`.
3. Backend validates length (max chars) and rate limits.
4. Backend extracts structured requirements (role, must-have skills, nice-to-have, seniority, domain).
5. For each requirement bucket, retriever fetches top-k chunks (possibly multiple sub-queries).
6. LLM generates a **fixed schema** JSON merged with human-readable summary sections for the UI.
7. Response shape matches **POST /v1/jd-fit** (v1); `disclaimers` must include that the output is informational, not a hiring decision.

## 5. API contracts (conceptual)

**POST /v1/chat**

- Request: `{ "messages": [ { "role": "user"|"assistant", "content": string } ] }`
- Response: `{ "reply": string, "citations": [ { "chunk_id": string, "title": string } ] }`
- Errors: `400` validation, `429` rate limit, `502` upstream LLM failure

**POST /v1/jd-fit**

- Request: `{ "jd_text": string }`
- Response (v1): `{ "summary": string, "match_rows": [ { "requirement": string, "fit": "strong"|"partial"|"gap"|"unknown", "rationale": string, "source_chunk_ids": string[] } ], "disclaimers": string[] }`
- Same error classes

**Health**

- `GET /health` for uptime checks

CORS: allow the GitHub Pages origin(s) only.

## 6. Security and abuse

- API keys only in server environment.
- Rate limiting per IP and/or global (token bucket).
- Max body size for JD and chat payloads; timeout on LLM calls.
- Prompt injection mitigation: system prompt instructs model to treat user content as untrusted data; retrieved corpus is “trusted”; do not follow instructions inside JD that ask to ignore policy (defense in depth—monitoring and refusal patterns).
- Do not log full JD text in production logs by default; log length and hash if diagnostics needed.
- **Trace backends (§11):** Same rules apply—configure trace export to omit or hash user/JD bodies in production, or restrict tracing to staging with synthetic fixtures for deep debugging.

## 7. Error handling (UX)

- **Transient failures:** User sees short friendly message; optional single retry on client for chat.
- **Rate limit:** Clear message (“Try again in a minute”).
- **Validation:** JD too long → ask user to trim paste.
- **Partial retrieval:** If no chunks above threshold, reply with honest “I don’t have sourced information for that” rather than hallucinating.

## 8. Phased rollout

| Phase | Deliverable |
|-------|----------------|
| **P0** | Backend skeleton, `/health`, `/v1/chat` with retrieval + static corpus; frontend wired with env-based API URL; deploy backend. |
| **P1** | Corpus expansion + chunk metadata; citations in UI; basic rate limit and logging; wire trace export (§11) for staging at minimum. |
| **P2** | `/v1/jd-fit` with structured output + dedicated UI section in chat drawer or tab. |
| **P3** | Golden datasets + regression evaluators (§11); prompt/tag versioning in traces; optional bounded tool router if metrics show need. |

## 9. Testing strategy

- **Unit:** Chunking, citation formatting, schema validation for JD output (Pydantic models).
- **Integration:** Mock LLM; real retriever against fixture index for golden queries.
- **Manual QA:** Smoke script for chat and JD from production-like build; verify CORS and 429 behavior.
- **Quality gates:** Small set of “must not hallucinate” questions where answer must cite correct section or abstain.
- **Trace-backed regression:** Run golden prompts against staging or CI with tracing enabled; compare latency/token usage and evaluator scores across prompt/corpus versions (see §11).

## 10. Open decisions (resolved for v1)

| Topic | Decision |
|-------|----------|
| LLM provider | Single provider initially; abstract client interface for swap later. |
| Vector store | Choose based on hosting: start with simplest managed option that fits free tier / cost constraints. |
| Voice | Out of scope until chat + JD are stable. |
| Personality | One system prompt; adjust tone (peer vs recruiter) via short user-facing “mode” toggle only if it does not fork prompts excessively—default single prompt for v1. |
| Observability platform | Default recommendation: **LangSmith** if using LangChain/LangGraph for fastest path to traces + datasets + evaluators; **Langfuse** as OSS/cloud alternative (framework-agnostic, self-host friendly). Final choice recorded in implementation plan. |

## 11. Observability, tracing, and evaluation (production-style iteration)

**Objectives**

- **Precision / accuracy:** See whether answers stay grounded in retrieved chunks (not generic fluff), whether retrieval returns the right sections, and how often the model abstains correctly.
- **Debuggability:** Inspect a single request end-to-end: timing per step, prompts, retrieved chunk ids and scores, token usage, model id.
- **Improvement loop:** Version prompts and corpus together; rerun offline evals before shipping; spot regressions after changes.

**What to trace (span hierarchy)**

Each `request_id` should tie together child spans (names are illustrative):

1. **http** — route (`chat` | `jd_fit`), status, latency.
2. **retrieve** — embedding call (if applicable), vector query, `top_k` chunk ids + scores + corpus version tag.
3. **prompt_build** — template version id; counts only for user content size (not full text in prod traces unless allowed).
4. **llm** — provider, model, input/output token counts; finish reason; retry count.
5. **jd_fit only:** **extract_requirements**, **retrieve_per_cluster**, **compose_report** — separate spans so slow or wrong JD steps are visible.

Attach **metadata tags** on every trace: `corpus_version`, `prompt_version`, `environment` (`prod` | `staging` | `ci`), optional `session_id` (opaque uuid only).

**Tooling comparison (judgement for this project)**

| Option | Fit | Notes |
|--------|-----|------|
| **[LangSmith](https://smith.langchain.com/)** | **Recommended default** if you adopt LangChain/LangGraph | First-class traces for chains, **Datasets** + **Evaluators** (including LLM-as-judge), comparison runs, collaboration. Paid tiers; official LangChain integration. |
| **[Langfuse](https://langfuse.com/)** | Strong alternative | Open-source + hosted cloud; works with or without LangChain; scores and dashboards; good when you want vendor flexibility or self-hosting to control cost/data residency. |
| **[Arize Phoenix](https://arize.com/docs/phoenix)** | Optional complement | Excellent for embedding drift / retrieval debugging and OSS workflows; can be used alongside either of the above for deeper vector-quality analysis if needed later. |
| **Helicone / OpenTelemetry-only** | Gateway / generic | Helicone is useful as an LLM proxy logger; OTel alone gives traces but you still want a UI and eval storage—usually pair with Langfuse or similar. |

**Recommendation:** Start with **LangSmith** *if* the backend uses LangChain-style tracing (fastest path to “production-like” learning loops documented in LangChain docs). If you prefer minimal framework lock-in or self-host OSS first, start with **Langfuse** and keep LLM calls wrapped in a thin abstraction so you can add or switch exporters later.

**Measuring “accuracy” (practical definition)**

- **Retrieval:** Precision@k / “correct chunk in top 3” on a labeled set of (question → relevant chunk ids); log average similarity scores when labels exist.
- **Generation:** **Citation alignment** — stated facts in the answer should map to retrieved chunk ids (manual or semi-automated check); optional **LLM-as-judge** rubric (correctness, groundedness, helpfulness) with human spot-checks because judges can be biased.
- **JD fit:** Schema validity rate; row-level spot checks that `source_chunk_ids` support the `fit` label; rate of `unknown` when corpus has no signal (desired behavior vs hallucinated strength).

**Dashboards and alerts (lightweight)**

- p95 latency for `chat` and `jd_fit`; error rate; tokens per request (cost proxy).
- Eval regression: fail CI or block deploy if golden-set metrics drop beyond a threshold (tune thresholds once baselines exist).

**Privacy alignment**

- Production traces: prefer **hashed or truncated** user questions and JD excerpts in exported spans unless you explicitly enable full capture in a private LangSmith/Langfuse project with access controls.
- Use **staging** + **synthetic JD fixtures** for deep inspection of full payloads during development.

## 12. Traceability to current codebase

- `src/components/Chatbot.tsx` today uses `mockResponses` and `getBotResponse`; implementation will replace send path with API client and loading/error states while preserving Framer Motion UI patterns.
- `src/App.tsx` already mounts `Chatbot`; no structural change required beyond optional props or context for API base URL.

---

**Next step after approval:** Use the writing-plans skill to produce an implementation plan (repo layout for `api/`, env vars, first deploy milestone, trace backend env vars and CI eval hooks per §11).
