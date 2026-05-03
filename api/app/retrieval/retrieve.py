from dataclasses import dataclass

import numpy as np

from app.retrieval.index import VectorIndex


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: str
    title: str
    text: str
    score: float


def top_k_indices(query: list[float], matrix: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
    q = np.array(query, dtype=np.float64)
    n = np.linalg.norm(q)
    if n == 0:
        q = np.zeros_like(q)
    else:
        q = q / n
    sims = matrix @ q
    if sims.shape[0] == 0:
        return np.array([], dtype=np.int64), np.array([], dtype=np.float64)
    k = min(k, int(sims.shape[0]))
    idx = np.argpartition(-sims, kth=k - 1)[:k]
    idx = idx[np.argsort(-sims[idx])]
    return idx, sims[idx]


def retrieve(
    index: VectorIndex,
    query_embedding: list[float],
    *,
    top_k: int = 5,
    min_score: float = 0.12,
) -> list[RetrievedChunk]:
    idx, scores = top_k_indices(query_embedding, index.matrix, top_k)
    out: list[RetrievedChunk] = []
    for i, s in zip(idx.tolist(), scores.tolist()):
        if min_score >= 0 and s < min_score:
            continue
        out.append(
            RetrievedChunk(
                chunk_id=index.chunk_ids[i],
                title=index.titles[i],
                text=index.texts[i],
                score=float(s),
            )
        )
    return out
