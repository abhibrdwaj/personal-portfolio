# Portfolio API

FastAPI service for RAG-grounded **chat** (`POST /v1/chat`), **JD fit** (`POST /v1/jd-fit`), and **voice replies** (`POST /v1/chat/speak`). Profile text lives under `corpus/` as Markdown; at startup the service chunks, embeds, and builds an in-memory cosine index.

## Local run

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# set OPENAI_API_KEY and optionally CORS_ORIGINS
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: `GET /health`
- Chat: `POST /v1/chat` with JSON body `{ "messages": [{ "role": "user"|"assistant", "content": "..." }], "session_id": "<optional uuid>" }`
- JD fit: `POST /v1/jd-fit` with `{ "jd_text": "..." }` (minimum 50 characters)
- Speak: `POST /v1/chat/speak` with `{ "text": "..." }` (max 2000 characters) → `audio/mpeg` bytes read back in a cloned voice via Fish Audio. On-demand only (called when a visitor clicks play on a reply) to bound cost per call. Returns 502 if the upstream TTS call fails (e.g. insufficient Fish Audio API credit — see their `/app/developers` dashboard).

## Configuration

See `api/.env.example`. Important variables:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required when `EMBED_MODE=openai` |
| `EMBED_MODE` | `openai` (default) or `mock` (CI / offline) |
| `CORS_ORIGINS` | Comma-separated allowed browser origins |
| `CORPUS_VERSION` | Tag for logs and traces (e.g. git SHA in prod) |
| `LANGFUSE_*` | Optional; structured logs always record span metadata |
| `TTS_MODE` | `mock` (default, no network) or `fish_audio` |
| `FISH_AUDIO_API_KEY` / `FISH_AUDIO_VOICE_ID` | Required when `TTS_MODE=fish_audio`. Voice id comes from a one-time clone created via Fish Audio's web app or `POST /model` with a sample of your voice. |

## Deploy (Render / Railway)

Start command:

```bash
cd api && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Set on the host: `OPENAI_API_KEY`, `CORS_ORIGINS` (your `https://<user>.github.io` origin and dev origins as needed), `CORPUS_VERSION` to the deployed commit SHA, and `ENVIRONMENT=prod`. Set `TTS_MODE=fish_audio` plus `FISH_AUDIO_API_KEY`/`FISH_AUDIO_VOICE_ID` to enable voice replies; leave `TTS_MODE=mock` (default) to skip it.

Smoke checks:

```bash
curl -sS "https://<api-host>/health"
curl -sS -X POST "https://<api-host>/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is your background?"}]}'
```

## Golden retrieval

```bash
cd api && EMBED_MODE=mock OPENAI_API_KEY=sk-test python scripts/run_golden.py
```

## Observability

Each request emits JSON log lines with spans (`retrieve`, `prompt_build`, `llm`, `http`, plus JD-specific spans). User and JD bodies are fingerprinted (`sha256` prefix + length), not logged in full. Langfuse export flags are recorded when keys are configured; wire the official Langfuse SDK or HTTP ingestion when you want cloud traces.
