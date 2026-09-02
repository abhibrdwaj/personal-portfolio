#!/usr/bin/env python3
"""Golden retrieval checks: built query text must retrieve expected chunk ids (mock embeddings)."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


async def run(fixture_path: Path) -> int:
    os.environ.setdefault("EMBED_MODE", "mock")
    os.environ.setdefault("OPENAI_API_KEY", "sk-test")

    from app.corpus_loader import _parse_frontmatter, default_corpus_root, load_vector_index
    from app.llm.client import create_llm_client
    from app.retrieval.chunker import chunk_text
    from app.retrieval.retrieve import retrieve

    llm = create_llm_client(
        embed_mode=os.environ.get("EMBED_MODE", "mock"),
        api_key=os.environ.get("OPENAI_API_KEY", "sk-test"),
        chat_model="gpt-4o-mini",
        embed_model="text-embedding-3-small",
    )
    index = await load_vector_index(llm)
    corpus_root = default_corpus_root()
    failures = 0

    for line in fixture_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        expected = set(row["expected_chunk_ids"])
        rel = row["file"]
        chunk_index = int(row["chunk_index"])
        path = corpus_root / rel
        raw = path.read_text(encoding="utf-8")
        meta, body = _parse_frontmatter(raw, path)
        parts = chunk_text(body)
        stem = meta.get("title", "").strip() or Path(rel).stem.replace("_", " ").title()
        part = parts[chunk_index]
        question = f"{stem}\n\n{part}"
        emb = (await llm.embed([question]))[0]
        hits = retrieve(index, emb, top_k=min(15, len(index.chunk_ids)), min_score=-1.0)
        got = {h.chunk_id for h in hits}
        if not (got & expected):
            print(f"FAIL expected∩got empty: expected={expected} got={got} file={rel}")
            failures += 1
        else:
            print(f"OK {rel} chunk {chunk_index}")

    await llm.aclose()
    return failures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fixture",
        type=Path,
        default=ROOT / "tests" / "fixtures" / "golden_chat.jsonl",
    )
    args = parser.parse_args()
    n = asyncio.run(run(args.fixture))
    if n:
        sys.exit(1)


if __name__ == "__main__":
    main()
