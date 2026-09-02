import hashlib
import math
from typing import Protocol, Sequence

import httpx
import numpy as np


class LLMClient(Protocol):
    async def embed(self, texts: Sequence[str]) -> list[list[float]]: ...
    async def complete(self, system: str, user: str) -> str: ...
    async def aclose(self) -> None: ...


def _mock_embedding(text: str, dim: int = 64) -> list[float]:
    """Deterministic unit vector from text (for tests / mock mode)."""
    h = hashlib.sha256(text.encode("utf-8")).digest()
    repeats = (dim + len(h) - 1) // len(h)
    raw = (h * repeats)[:dim]
    vec = np.array(list(raw), dtype=np.float64)
    vec = vec - np.mean(vec)
    n = np.linalg.norm(vec)
    if n == 0:
        return [1.0 / math.sqrt(dim)] * dim
    vec = vec / n
    return vec.tolist()


class MockLLMClient:
    """Offline embeddings + canned or echo completions for CI."""

    def __init__(self, reply: str = "ok", embed_dim: int = 64) -> None:
        self._reply = reply
        self._embed_dim = embed_dim

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        return [_mock_embedding(t, self._embed_dim) for t in texts]

    async def complete(self, system: str, user: str) -> str:
        return self._reply

    async def aclose(self) -> None:
        return None


class OpenAILLMClient:
    def __init__(self, api_key: str, chat_model: str, embed_model: str) -> None:
        self._chat_model = chat_model
        self._embed_model = embed_model
        self._http = httpx.AsyncClient(
            base_url="https://api.openai.com/v1",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0,
        )

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        response = await self._http.post(
            "/embeddings",
            json={"model": self._embed_model, "input": list(texts)},
        )
        response.raise_for_status()
        data = response.json()["data"]
        return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]

    async def complete(self, system: str, user: str) -> str:
        response = await self._http.post(
            "/chat/completions",
            json={
                "model": self._chat_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    async def aclose(self) -> None:
        await self._http.aclose()


def create_llm_client(
    *,
    embed_mode: str,
    api_key: str,
    chat_model: str,
    embed_model: str,
) -> LLMClient:
    if embed_mode == "mock":
        return MockLLMClient()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required when EMBED_MODE=openai")
    return OpenAILLMClient(api_key, chat_model, embed_model)
