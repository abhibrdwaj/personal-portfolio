import json
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import Settings
from app.deps import get_app_settings, get_llm_client, get_retrieval_backend
from app.llm.client import LLMClient
from app.models import JdFitRequest, JdFitResponse
from app.observability.trace import TraceRecorder, payload_fingerprint
from app.prompts.jd_fit import (
    jd_compose_system_prompt,
    jd_compose_user_prompt,
    jd_extract_system_prompt,
    jd_extract_user_prompt,
)
from app.retrieval.backends import RetrievalBackend

router = APIRouter(tags=["jd_fit"])

DEFAULT_DISCLAIMERS = [
    "This analysis is informational only and is not a hiring decision, interview score, or legal advice.",
    "Verify credentials and experience with the candidate and your standard process.",
]


def _parse_json_object(text: str) -> dict[str, Any]:
    t = text.strip()
    if t.startswith("```"):
        t = t.removeprefix("```json").removeprefix("```").strip()
        if t.endswith("```"):
            t = t[:-3].strip()
    return json.loads(t)


@router.post("/jd-fit", response_model=JdFitResponse)
async def jd_fit(
    req: JdFitRequest,
    request: Request,
    llm: LLMClient = Depends(get_llm_client),
    backend: RetrievalBackend = Depends(get_retrieval_backend),
    settings: Settings = Depends(get_app_settings),
) -> JdFitResponse:
    rid = getattr(request.state, "request_id", "unknown")
    jd_fp = payload_fingerprint(req.jd_text)
    trace = TraceRecorder(
        request_id=rid,
        route="jd_fit",
        corpus_version=settings.corpus_version,
        prompt_version=settings.prompt_version,
        environment=settings.environment,
        session_id=None,
        langfuse_public_key=settings.langfuse_public_key,
        langfuse_secret_key=settings.langfuse_secret_key,
        langfuse_host=settings.langfuse_host,
    )

    t_ex = time.perf_counter()
    try:
        raw_extract = await llm.complete(
            jd_extract_system_prompt(),
            jd_extract_user_prompt(req.jd_text),
        )
    except Exception as exc:  # noqa: BLE001
        trace.span("extract_requirements", (time.perf_counter() - t_ex) * 1000, error=str(exc), jd_fp=jd_fp)
        raise HTTPException(status_code=502, detail="upstream_llm_failure") from exc
    trace.span("extract_requirements", (time.perf_counter() - t_ex) * 1000, jd_fp=jd_fp)

    try:
        data_extract = _parse_json_object(raw_extract)
    except (json.JSONDecodeError, ValueError) as exc:
        trace.span("extract_requirements", 0, error="invalid_json", jd_fp=jd_fp)
        raise HTTPException(status_code=502, detail="upstream_llm_invalid_json") from exc

    requirements_raw = data_extract.get("requirements", [])
    if not isinstance(requirements_raw, list):
        requirements_raw = []
    requirements = [str(x).strip() for x in requirements_raw if str(x).strip()][:40]

    t_ret = time.perf_counter()
    excerpt_lines: list[str] = []
    seen_ids: set[str] = set()
    for req_line in requirements[:18]:
        try:
            emb = (await llm.embed([req_line]))[0]
        except Exception as exc:  # noqa: BLE001
            trace.span("retrieve_per_cluster", (time.perf_counter() - t_ret) * 1000, error=str(exc))
            raise HTTPException(status_code=502, detail="upstream_llm_failure") from exc
        hits = await backend.retrieve(emb, top_k=4, min_score=0.1)
        for h in hits:
            if h.chunk_id not in seen_ids:
                seen_ids.add(h.chunk_id)
                excerpt_lines.append(f"[chunk_id={h.chunk_id} title={h.title} kind={h.kind}]\n{h.text}")
    trace.span(
        "retrieve_per_cluster",
        (time.perf_counter() - t_ret) * 1000,
        chunk_ids=list(seen_ids),
        requirement_count=len(requirements),
    )

    excerpts_block = (
        "\n\n---\n\n".join(excerpt_lines) if excerpt_lines else "(no excerpts above similarity threshold)"
    )

    t_comp = time.perf_counter()
    try:
        raw_report = await llm.complete(
            jd_compose_system_prompt(),
            jd_compose_user_prompt(
                jd_text=req.jd_text,
                requirements_json=json.dumps({"requirements": requirements}),
                excerpts_block=excerpts_block,
            ),
        )
    except Exception as exc:  # noqa: BLE001
        trace.span("compose_report", (time.perf_counter() - t_comp) * 1000, error=str(exc), jd_fp=jd_fp)
        raise HTTPException(status_code=502, detail="upstream_llm_failure") from exc
    trace.span("compose_report", (time.perf_counter() - t_comp) * 1000, jd_fp=jd_fp)

    try:
        data_report = _parse_json_object(raw_report)
        parsed = JdFitResponse.model_validate(data_report)
    except Exception as exc:  # noqa: BLE001
        trace.span("compose_report", 0, error="invalid_schema", jd_fp=jd_fp)
        raise HTTPException(status_code=502, detail="upstream_llm_invalid_json") from exc

    merged_disclaimers = list(dict.fromkeys([*DEFAULT_DISCLAIMERS, *parsed.disclaimers]))
    out = JdFitResponse(
        summary=parsed.summary,
        match_rows=parsed.match_rows,
        disclaimers=merged_disclaimers,
    )
    trace.span("http", trace.total_ms(), status=200, row_count=len(out.match_rows))
    return out
