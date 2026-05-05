from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class VectorIndex:
    """Row-normalized embedding matrix and parallel metadata."""

    matrix: np.ndarray  # shape (n, d), rows L2-normalized
    chunk_ids: list[str]
    titles: list[str]
    kinds: list[str]
    texts: list[str]


def build_index(
    chunk_ids: list[str],
    titles: list[str],
    kinds: list[str],
    texts: list[str],
    embeddings: list[list[float]],
) -> VectorIndex:
    if not embeddings:
        raise ValueError("No embeddings to index")
    if not (len(chunk_ids) == len(titles) == len(kinds) == len(texts) == len(embeddings)):
        raise ValueError("Index metadata and embeddings length mismatch")
    mat = np.array(embeddings, dtype=np.float64)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    mat = mat / norms
    return VectorIndex(matrix=mat, chunk_ids=chunk_ids, titles=titles, kinds=kinds, texts=texts)
