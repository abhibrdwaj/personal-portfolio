from app.corpus_loader import default_corpus_root, iter_corpus_chunk_rows


def test_iter_corpus_chunk_rows_covers_real_corpus():
    rows = iter_corpus_chunk_rows(default_corpus_root())
    assert rows
    assert all(r.chunk_id and r.kind and r.embed_input for r in rows)
    chunk_ids = [r.chunk_id for r in rows]
    assert len(chunk_ids) == len(set(chunk_ids))
