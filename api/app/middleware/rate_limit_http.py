from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.rate_limit import RateLimiter


class V1RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limiter: RateLimiter) -> None:
        super().__init__(app)
        self._limiter = limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if request.method == "OPTIONS":
            return await call_next(request)
        if path.startswith("/v1/"):
            client = request.client.host if request.client else "unknown"
            if not self._limiter.allow(client):
                return JSONResponse({"detail": "rate_limit_exceeded"}, status_code=429)
        return await call_next(request)
