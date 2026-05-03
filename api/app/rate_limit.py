import time
from collections import defaultdict


class RateLimiter:
    """Sliding window per key (e.g. client IP)."""

    def __init__(self, limit_per_minute: int, window_seconds: float = 60.0) -> None:
        self._limit = max(1, limit_per_minute)
        self._window = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        cutoff = now - self._window
        hits = self._hits[key]
        hits[:] = [t for t in hits if t > cutoff]
        if len(hits) >= self._limit:
            return False
        hits.append(now)
        return True
