from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class VectorIndex:
    """Row-normalized embedding matrix and parallel metadata."""

    matrix: np.ndarray  # shape (n, d), rows L2-normalized
    chunk_ids: list[str]
    titles: list[str]
    texts: list[str]


def build_index(
    chunk_ids: list[str],
    titles: list[str],
    texts: list[str],
    embeddings: list[list[float]],
) -> VectorIndex:
    if not embeddings:
        raise ValueError("No embeddings to index")
    mat = np.array(embeddings, dtype=np.float64)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    mat = mat / norms
    return VectorIndex(matrix=mat, chunk_ids=chunk_ids, titles=titles, texts=texts)
