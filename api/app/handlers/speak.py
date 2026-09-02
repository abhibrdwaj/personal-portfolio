import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.deps import get_tts_client
from app.models import SpeakRequest
from app.tts.client import TTSClient

router = APIRouter(tags=["speak"])
logger = logging.getLogger("portfolio.trace")


@router.post("/chat/speak")
async def speak(
    req: SpeakRequest,
    request: Request,
    tts: TTSClient = Depends(get_tts_client),
) -> Response:
    rid = getattr(request.state, "request_id", "unknown")
    try:
        audio = await tts.synthesize(req.text)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "speak upstream_tts_failure request_id=%s text_len=%d error=%s",
            rid,
            len(req.text),
            exc,
        )
        raise HTTPException(status_code=502, detail="upstream_tts_failure") from exc
    return Response(content=audio, media_type="audio/mpeg")
