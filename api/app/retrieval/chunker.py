def chunk_text(text: str, max_chars: int = 1200) -> list[str]:
    normalized = text.strip()
    if not normalized:
        return []
    paragraphs = [p.strip() for p in normalized.split("\n\n") if p.strip()]
    chunks: list[str] = []
    buffer = ""
    for p in paragraphs:
        if len(buffer) + len(p) + 2 <= max_chars:
            buffer = f"{buffer}\n\n{p}" if buffer else p
            continue
        if buffer:
            chunks.append(buffer)
        if len(p) <= max_chars:
            buffer = p
        else:
            for i in range(0, len(p), max_chars):
                chunks.append(p[i : i + max_chars])
            buffer = ""
    if buffer:
        chunks.append(buffer)
    return chunks
