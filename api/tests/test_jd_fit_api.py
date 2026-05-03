import json

import pytest
from fastapi.testclient import TestClient

from app.llm.client import _mock_embedding
from app.main import app

JD_SAMPLE = (
    "We are hiring a Senior Software Engineer to build customer-facing web applications. "
    "You will work with React, TypeScript, and REST APIs across a distributed system. "
    "Minimum five years of experience required in production environments."
)


class ScriptedJdLlm:
    def __init__(self) -> None:
        self._n = 0

    async def embed(self, texts):
        return [_mock_embedding(t, 64) for t in texts]

    async def complete(self, system: str, user: str) -> str:
        self._n += 1
        if self._n == 1:
            return json.dumps({"requirements": ["React and TypeScript", "Distributed systems experience"]})
        return json.dumps(
            {
                "summary": "There is partial alignment with full-stack and systems-oriented work.",
                "match_rows": [
                    {
                        "requirement": "React and TypeScript",
                        "fit": "partial",
                        "rationale": "Profile excerpts reference modern frontend stacks.",
                        "source_chunk_ids": [],
                    },
                    {
                        "requirement": "Distributed systems experience",
                        "fit": "unknown",
                        "rationale": "Insufficient specific evidence in the provided excerpts.",
                        "source_chunk_ids": [],
                    },
                ],
                "disclaimers": ["Custom disclaimer from model output."],
            }
        )

    async def aclose(self) -> None:
        return None


@pytest.fixture
def client_scripted_jd():
    with TestClient(app) as client:
        app.state.llm_client = ScriptedJdLlm()
        yield client


def test_jd_fit_returns_schema(client_scripted_jd):
    res = client_scripted_jd.post("/v1/jd-fit", json={"jd_text": JD_SAMPLE})
    assert res.status_code == 200
    body = res.json()
    assert "summary" in body
    assert len(body["match_rows"]) >= 1
    assert isinstance(body["disclaimers"], list)
    assert len(body["disclaimers"]) >= 2


def test_jd_fit_too_short(client_scripted_jd):
    res = client_scripted_jd.post("/v1/jd-fit", json={"jd_text": "short"})
    assert res.status_code == 422
