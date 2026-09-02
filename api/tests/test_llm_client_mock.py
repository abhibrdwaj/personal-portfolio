import httpx
import pytest

from app.llm.client import OpenAILLMClient


@pytest.mark.asyncio
async def test_openai_embed_parses_sorted_indices():
    def handler(request: httpx.Request) -> httpx.Response:
        if "embeddings" in str(request.url):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"object": "embedding", "index": 1, "embedding": [0.0, 1.0, 0.0]},
                        {"object": "embedding", "index": 0, "embedding": [1.0, 0.0, 0.0]},
                    ]
                },
            )
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    http = httpx.AsyncClient(
        transport=transport,
        base_url="https://api.openai.com/v1",
        headers={"Authorization": "Bearer sk"},
    )
    client = OpenAILLMClient("sk", "gpt-4o-mini", "text-embedding-3-small")
    await client._http.aclose()
    client._http = http
    try:
        out = await client.embed(["a", "b"])
        assert out[0] == [1.0, 0.0, 0.0]
        assert out[1] == [0.0, 1.0, 0.0]
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_openai_complete_returns_message_content():
    def handler(request: httpx.Request) -> httpx.Response:
        if "chat/completions" in str(request.url):
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "done"}}]},
            )
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    http = httpx.AsyncClient(
        transport=transport,
        base_url="https://api.openai.com/v1",
        headers={"Authorization": "Bearer sk"},
    )
    client = OpenAILLMClient("sk", "gpt-4o-mini", "text-embedding-3-small")
    await client._http.aclose()
    client._http = http
    try:
        text = await client.complete("sys", "user")
        assert text == "done"
    finally:
        await client.aclose()
