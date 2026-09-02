from typing import Protocol

import httpx


class TTSClient(Protocol):
    async def synthesize(self, text: str) -> bytes: ...
    async def aclose(self) -> None: ...


class MockTTSClient:
    """Deterministic fake audio bytes for tests / CI (no network)."""

    async def synthesize(self, text: str) -> bytes:
        return f"MOCK-AUDIO:{text}".encode("utf-8")

    async def aclose(self) -> None:
        return None


class FishAudioTTSClient:
    def __init__(self, api_key: str, voice_id: str, model: str = "s2.1-pro-free") -> None:
        self._voice_id = voice_id
        self._model = model
        self._http = httpx.AsyncClient(
            base_url="https://api.fish.audio",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )

    async def synthesize(self, text: str) -> bytes:
        response = await self._http.post(
            "/v1/tts",
            json={
                "text": text,
                "reference_id": self._voice_id,
                "model": self._model,
                "format": "mp3",
            },
        )
        response.raise_for_status()
        return response.content

    async def aclose(self) -> None:
        await self._http.aclose()


def create_tts_client(
    *,
    tts_mode: str,
    api_key: str,
    voice_id: str,
    model: str,
) -> TTSClient:
    if tts_mode == "mock":
        return MockTTSClient()
    if not api_key:
        raise RuntimeError("FISH_AUDIO_API_KEY is required when TTS_MODE=fish_audio")
    if not voice_id:
        raise RuntimeError("FISH_AUDIO_VOICE_ID is required when TTS_MODE=fish_audio")
    return FishAudioTTSClient(api_key, voice_id, model)
