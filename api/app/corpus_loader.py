from dataclasses import dataclass
from pathlib import Path

from app.llm.client import LLMClient
from app.retrieval.chunker import chunk_text
from app.retrieval.index import VectorIndex, build_index


@dataclass(frozen=True)
class CorpusPaths:
    root: Path


def default_corpus_root() -> Path:
    return Path(__file__).resolve().parent.parent / "corpus"


async def load_vector_index(
    llm: LLMClient,
    corpus_root: Path | None = None,
    *,
    max_chars: int = 1200,
) -> VectorIndex:
    root = corpus_root or default_corpus_root()
    paths = sorted(root.glob("**/*.md"))
    if not paths:
        raise RuntimeError(f"No markdown corpus files under {root}")

    chunk_ids: list[str] = []
    titles: list[str] = []
    texts: list[str] = []
    embed_inputs: list[str] = []

    for path in paths:
        stem = path.stem.replace("_", " ").title()
        raw = path.read_text(encoding="utf-8")
        parts = chunk_text(raw, max_chars=max_chars)
        for i, part in enumerate(parts):
            cid = f"{path.stem}-{i}"
            chunk_ids.append(cid)
            titles.append(stem)
            texts.append(part)
            embed_inputs.append(f"{stem}\n\n{part}")

    embeddings = await llm.embed(embed_inputs)
    return build_index(chunk_ids, titles, texts, embeddings)
