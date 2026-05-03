import time

from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import Settings
from app.deps import get_app_settings, get_llm_client, get_vector_index
from app.llm.client import LLMClient
from app.retrieval.index import VectorIndex
from app.models import ChatRequest, ChatResponse, Citation
from app.observability.trace import TraceRecorder, payload_fingerprint
from app.prompts.chat import chat_system_prompt, chat_user_prompt
from app.retrieval.retrieve import retrieve

router = APIRouter(tags=["chat"])

MAX_HISTORY_MESSAGES = 20


def _last_user_text(messages: list) -> str:
    for m in reversed(messages):
        if m.role == "user":
            return m.content
    return messages[-1].content


def _history_block(messages: list) -> str:
    tail = messages[-MAX_HISTORY_MESSAGES:]
    lines: list[str] = []
    for m in tail:
        lines.append(f"{m.role}: {m.content}")
    return "\n".join(lines) if lines else "(empty)"


def _retrieved_block(chunks: list) -> str:
    if not chunks:
        return "(no excerpts above similarity threshold)"
    parts: list[str] = []
    for c in chunks:
        parts.append(f"[chunk_id={c.chunk_id} title={c.title}]\n{c.text}")
    return "\n\n---\n\n".join(parts)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    request: Request,
    llm: LLMClient = Depends(get_llm_client),
    index: VectorIndex = Depends(get_vector_index),
    settings: Settings = Depends(get_app_settings),
) -> ChatResponse:
    rid = getattr(request.state, "request_id", "unknown")
    trace = TraceRecorder(
        request_id=rid,
        route="chat",
        corpus_version=settings.corpus_version,
        prompt_version=settings.prompt_version,
        environment=settings.environment,
        session_id=req.session_id,
        langfuse_public_key=settings.langfuse_public_key,
        langfuse_secret_key=settings.langfuse_secret_key,
        langfuse_host=settings.langfuse_host,
    )

    latest = _last_user_text(req.messages)
    t_embed = time.perf_counter()
    try:
        q_emb = (await llm.embed([latest]))[0]
    except Exception as exc:  # noqa: BLE001
        trace.span(
            "retrieve",
            (time.perf_counter() - t_embed) * 1000,
            phase="embed",
            error=str(exc),
            user_fp=payload_fingerprint(latest),
        )
        raise HTTPException(status_code=502, detail="upstream_llm_failure") from exc
    trace.span(
        "retrieve",
        (time.perf_counter() - t_embed) * 1000,
        phase="embed",
        user_fp=payload_fingerprint(latest),
    )

    t_vec = time.perf_counter()
    chunks = retrieve(index, q_emb, top_k=5, min_score=0.12)
    trace.span(
        "retrieve",
        (time.perf_counter() - t_vec) * 1000,
        phase="vector",
        chunk_ids=[c.chunk_id for c in chunks],
        scores=[c.score for c in chunks],
    )

    t_prompt = time.perf_counter()
    system = chat_system_prompt()
    user = chat_user_prompt(
        retrieved_block=_retrieved_block(chunks),
        history_block=_history_block(req.messages),
        latest_user=latest,
    )
    trace.span("prompt_build", (time.perf_counter() - t_prompt) * 1000, user_len=len(latest))

    t_llm = time.perf_counter()
    try:
        reply = await llm.complete(system, user)
    except Exception as exc:  # noqa: BLE001
        trace.span("llm", (time.perf_counter() - t_llm) * 1000, error=str(exc))
        raise HTTPException(status_code=502, detail="upstream_llm_failure") from exc
    trace.span("llm", (time.perf_counter() - t_llm) * 1000, model=settings.openai_chat_model)

    citations = [Citation(chunk_id=c.chunk_id, title=c.title) for c in chunks]
    trace.span("http", trace.total_ms(), status=200, citation_count=len(citations))
    return ChatResponse(reply=reply.strip(), citations=citations)
