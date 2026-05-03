import pytest
from fastapi.testclient import TestClient

from app.llm.client import _mock_embedding
from app.main import app


class ScriptedChatLlm:
    async def embed(self, texts):
        return [_mock_embedding(t, 64) for t in texts]

    async def complete(self, system: str, user: str) -> str:
        return "I can share sourced highlights from my profile excerpts when you ask something specific."

    async def aclose(self) -> None:
        return None


@pytest.fixture
def client_scripted_chat():
    with TestClient(app) as client:
        app.state.llm_client = ScriptedChatLlm()
        yield client


def test_chat_returns_reply_and_citations(client_scripted_chat):
    res = client_scripted_chat.post(
        "/v1/chat",
        json={"messages": [{"role": "user", "content": "What is your experience at Freshworks?"}]},
    )
    assert res.status_code == 200
    body = res.json()
    assert "reply" in body
    assert isinstance(body["citations"], list)
    assert body["reply"]


def test_chat_validation_error():
    with TestClient(app) as client:
        app.state.llm_client = ScriptedChatLlm()
        res = client.post("/v1/chat", json={"messages": []})
    assert res.status_code == 422


def test_chat_llm_failure_returns_502():
    class Boom:
        async def embed(self, texts):
            raise RuntimeError("down")

        async def complete(self, system, user):
            return "x"

        async def aclose(self):
            pass

    with TestClient(app) as client:
        app.state.llm_client = Boom()
        res = client.post(
            "/v1/chat",
            json={"messages": [{"role": "user", "content": "hi"}]},
        )
    assert res.status_code == 502
