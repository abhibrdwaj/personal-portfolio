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
