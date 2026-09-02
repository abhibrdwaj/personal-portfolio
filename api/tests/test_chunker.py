from app.retrieval.chunker import chunk_text


def test_chunker_splits_on_paragraphs():
    text = "A\n\nB\n\nC"
    chunks = chunk_text(text, max_chars=4)
    assert len(chunks) >= 2
    assert all(len(c) <= 6 for c in chunks)
