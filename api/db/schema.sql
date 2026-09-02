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
