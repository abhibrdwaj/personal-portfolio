import httpx
import pytest

from app.tts.client import FishAudioTTSClient, MockTTSClient, create_tts_client


@pytest.mark.asyncio
async def test_mock_tts_client_returns_nonempty_bytes():
    client = MockTTSClient()
    audio = await client.synthesize("hello there")
    assert isinstance(audio, bytes)
    assert len(audio) > 0
    await client.aclose()


@pytest.mark.asyncio
async def test_fish_audio_synthesize_posts_expected_request_and_returns_audio_bytes():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["auth"] = request.headers.get("authorization")
        captured["body"] = request.content
        return httpx.Response(200, content=b"FAKE-MP3-BYTES", headers={"content-type": "audio/mpeg"})

    transport = httpx.MockTransport(handler)
    client = FishAudioTTSClient("fish-key", "voice-123", model="s2.1-pro-free")
    await client._http.aclose()
    client._http = httpx.AsyncClient(
        transport=transport,
        base_url="https://api.fish.audio",
        headers={"Authorization": "Bearer fish-key"},
    )

    try:
        audio = await client.synthesize("speak this")
    finally:
        await client.aclose()

    assert audio == b"FAKE-MP3-BYTES"
    assert captured["url"] == "https://api.fish.audio/v1/tts"
    assert captured["auth"] == "Bearer fish-key"
    import json

    body = json.loads(captured["body"])
    assert body["text"] == "speak this"
    assert body["reference_id"] == "voice-123"
    assert body["model"] == "s2.1-pro-free"
    assert body["format"] == "mp3"


@pytest.mark.asyncio
async def test_fish_audio_synthesize_raises_on_http_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(402, json={"status": 402, "message": "insufficient credits"})

    transport = httpx.MockTransport(handler)
    client = FishAudioTTSClient("fish-key", "voice-123")
    await client._http.aclose()
    client._http = httpx.AsyncClient(transport=transport, base_url="https://api.fish.audio")

    with pytest.raises(httpx.HTTPStatusError):
        try:
            await client.synthesize("speak this")
        finally:
            await client.aclose()


def test_create_tts_client_mock_mode_returns_mock_client():
    client = create_tts_client(tts_mode="mock", api_key="", voice_id="", model="s2.1-pro-free")
    assert isinstance(client, MockTTSClient)


def test_create_tts_client_fish_audio_without_key_raises():
    with pytest.raises(RuntimeError):
        create_tts_client(tts_mode="fish_audio", api_key="", voice_id="voice-123", model="s2.1-pro-free")


def test_create_tts_client_fish_audio_without_voice_id_raises():
    with pytest.raises(RuntimeError):
        create_tts_client(tts_mode="fish_audio", api_key="fish-key", voice_id="", model="s2.1-pro-free")


def test_create_tts_client_fish_audio_with_config_returns_fish_audio_client():
    client = create_tts_client(
        tts_mode="fish_audio", api_key="fish-key", voice_id="voice-123", model="s2.1-pro-free"
    )
    assert isinstance(client, FishAudioTTSClient)
