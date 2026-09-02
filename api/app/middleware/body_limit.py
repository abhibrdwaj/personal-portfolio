from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_bytes: int) -> None:
        super().__init__(app)
        self._max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in ("POST", "PUT", "PATCH"):
            cl = request.headers.get("content-length")
            if cl is not None:
                try:
                    n = int(cl)
                except ValueError:
                    return JSONResponse({"detail": "invalid_content_length"}, status_code=400)
                if n > self._max_bytes:
                    return JSONResponse({"detail": "payload_too_large"}, status_code=413)
        return await call_next(request)
