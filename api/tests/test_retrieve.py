import numpy as np

from app.retrieval.index import build_index
from app.retrieval.retrieve import retrieve, top_k_indices


def test_top_k_ordering():
    matrix = np.array(
        [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.7, 0.7, 0.0],
        ],
        dtype=np.float64,
    )
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix = matrix / norms
    idx, scores = top_k_indices([1.0, 0.0, 0.0], matrix, k=2)
    assert set(idx.tolist()) == {0, 2}
    assert float(scores[0]) >= float(scores[1])


def test_retrieve_filters_low_score():
    index = build_index(
        ["a", "b"],
        ["t1", "t2"],
        ["experience", "project"],
        ["x", "y"],
        [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
        ],
    )
    hits = retrieve(index, [0.0, 1.0, 0.0], top_k=5, min_score=0.9)
    assert len(hits) == 1
    assert hits[0].chunk_id == "b"


def test_retrieve_filters_allowed_kinds():
    index = build_index(
        ["a", "b"],
        ["t1", "t2"],
        ["experience", "project"],
        ["x", "y"],
        [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
        ],
    )
    hits = retrieve(
        index,
        [0.0, 1.0, 0.0],
        top_k=5,
        min_score=-1.0,
        allowed_kinds={"experience"},
    )
    assert len(hits) == 1
    assert hits[0].chunk_id == "a"
