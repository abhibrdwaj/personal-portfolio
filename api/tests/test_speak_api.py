import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.tts.client import MockTTSClient


class ScriptedTts(MockTTSClient):
    async def synthesize(self, text: str) -> bytes:
        return b"SCRIPTED-AUDIO-BYTES"


@pytest.fixture
def client_scripted_tts():
    with TestClient(app) as client:
        app.state.tts_client = ScriptedTts()
        yield client


def test_speak_returns_audio_mpeg(client_scripted_tts):
    res = client_scripted_tts.post("/v1/chat/speak", json={"text": "hello there"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "audio/mpeg"
    assert res.content == b"SCRIPTED-AUDIO-BYTES"


def test_speak_validation_error_empty_text(client_scripted_tts):
    res = client_scripted_tts.post("/v1/chat/speak", json={"text": ""})
    assert res.status_code == 422


def test_speak_accepts_text_up_to_2000_chars(client_scripted_tts):
    res = client_scripted_tts.post("/v1/chat/speak", json={"text": "a" * 2000})
    assert res.status_code == 200


def test_speak_validation_error_text_too_long(client_scripted_tts):
    res = client_scripted_tts.post("/v1/chat/speak", json={"text": "a" * 2001})
    assert res.status_code == 422


def test_speak_tts_failure_returns_502():
    class Boom:
        async def synthesize(self, text: str) -> bytes:
            raise RuntimeError("down")

        async def aclose(self) -> None:
            return None

    with TestClient(app) as client:
        app.state.tts_client = Boom()
        res = client.post("/v1/chat/speak", json={"text": "hello"})
    assert res.status_code == 502


def test_speak_tts_failure_logs_the_upstream_error(caplog):
    class Boom:
        async def synthesize(self, text: str) -> bytes:
            raise RuntimeError("insufficient credit: 402")

        async def aclose(self) -> None:
            return None

    with TestClient(app) as client:
        app.state.tts_client = Boom()
        with caplog.at_level("ERROR", logger="portfolio.trace"):
            client.post("/v1/chat/speak", json={"text": "hello"})

    assert any("insufficient credit: 402" in record.message for record in caplog.records)
