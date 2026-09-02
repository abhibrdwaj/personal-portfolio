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


ALLOWED_KINDS = {
    "experience",
    "project",
    "education",
    "certification",
    "award",
    "meta",
    "eligibility",
}

ALLOWED_KIND_BY_TOP_DIR = {
    "experience": {"experience"},
    "projects": {"project"},
    "meta": {"meta"},
    "education_certifications": {"education", "certification", "award"},
    "eligibility": {"eligibility"},
}

# `eligibility` (visa/work-authorization/EEO self-ID content) is retrievable by
# /v1/jd-fit only — never by the open /v1/chat. See PUBLIC_CHAT_KINDS usage in
# app/handlers/chat.py.
PUBLIC_CHAT_KINDS = ALLOWED_KINDS - {"eligibility"}


def _parse_frontmatter(raw: str, path: Path) -> tuple[dict[str, str], str]:
    lines = raw.splitlines()
    if not lines or lines[0].strip() != "---":
        raise RuntimeError(f"Corpus file missing frontmatter start '---': {path}")

    closing = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            closing = i
            break
    if closing is None:
        raise RuntimeError(f"Corpus file missing frontmatter closing '---': {path}")

    frontmatter_lines = lines[1:closing]
    body = "\n".join(lines[closing + 1 :]).strip()
    meta: dict[str, str] = {}
    for line in frontmatter_lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in stripped:
            raise RuntimeError(f"Invalid frontmatter line in {path}: {line}")
        key, value = stripped.split(":", 1)
        meta[key.strip()] = value.strip().strip("'\"")
    return meta, body


def _infer_folder_kind_policy(path: Path, root: Path) -> set[str] | None:
    rel = path.relative_to(root)
    if len(rel.parts) <= 1:
        return None
    top = rel.parts[0]
    return ALLOWED_KIND_BY_TOP_DIR.get(top)


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
    kinds: list[str] = []
    texts: list[str] = []
    embed_inputs: list[str] = []

    for path in paths:
        raw = path.read_text(encoding="utf-8")
        meta, body = _parse_frontmatter(raw, path)
        kind = meta.get("kind", "").strip().lower()
        if not kind:
            raise RuntimeError(f"Corpus file requires frontmatter key `kind`: {path}")
        if kind not in ALLOWED_KINDS:
            raise RuntimeError(f"Unsupported corpus kind `{kind}` in {path}")

        allowed_by_folder = _infer_folder_kind_policy(path, root)
        if allowed_by_folder is not None and kind not in allowed_by_folder:
            allowed_csv = ", ".join(sorted(allowed_by_folder))
            raise RuntimeError(
                f"Corpus kind `{kind}` invalid for folder of {path}. Expected one of: {allowed_csv}"
            )

        title = meta.get("title", "").strip() or path.stem.replace("_", " ").title()
        parts = chunk_text(body, max_chars=max_chars)
        for i, part in enumerate(parts):
            cid = f"{path.stem}-{i}"
            chunk_ids.append(cid)
            titles.append(title)
            kinds.append(kind)
            texts.append(part)
            embed_inputs.append(f"{title}\n\nkind: {kind}\n\n{part}")

    embeddings = await llm.embed(embed_inputs)
    return build_index(chunk_ids, titles, kinds, texts, embeddings)
