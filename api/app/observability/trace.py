import hashlib
import json
import logging
import time
from typing import Any

logger = logging.getLogger("portfolio.trace")


def payload_fingerprint(text: str) -> str:
    digest = hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()[:16]
    return f"sha256:{digest}:len={len(text)}"


class TraceRecorder:
    """Structured JSON logs per span; Langfuse keys reserved for a future SDK integration."""

    def __init__(
        self,
        *,
        request_id: str,
        route: str,
        corpus_version: str,
        prompt_version: str,
        environment: str,
        session_id: str | None,
        langfuse_public_key: str = "",
        langfuse_secret_key: str = "",
        langfuse_host: str = "",
    ) -> None:
        self.request_id = request_id
        self.route = route
        self.corpus_version = corpus_version
        self.prompt_version = prompt_version
        self.environment = environment
        self.session_id = session_id
        self._lf_configured = bool(langfuse_public_key and langfuse_secret_key)
        self._lf_host = langfuse_host
        self._t0 = time.perf_counter()

    def _base(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "route": self.route,
            "corpus_version": self.corpus_version,
            "prompt_version": self.prompt_version,
            "environment": self.environment,
            "session_id": self.session_id,
            "langfuse_export": self._lf_configured,
            "langfuse_host": self._lf_host if self._lf_configured else "",
        }

    def span(self, name: str, duration_ms: float, **extra: Any) -> None:
        row = {"span": name, "duration_ms": round(duration_ms, 2), **self._base(), **extra}
        logger.info(json.dumps(row, default=str))

    def total_ms(self) -> float:
        return (time.perf_counter() - self._t0) * 1000
