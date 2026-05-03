from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    session_id: str | None = None


class Citation(BaseModel):
    chunk_id: str
    title: str


class ChatResponse(BaseModel):
    reply: str
    citations: list[Citation] = Field(default_factory=list)


class JdFitRequest(BaseModel):
    jd_text: str = Field(min_length=50, max_length=24000)


class MatchRow(BaseModel):
    requirement: str
    fit: str = Field(pattern="^(strong|partial|gap|unknown)$")
    rationale: str
    source_chunk_ids: list[str]


class JdFitResponse(BaseModel):
    summary: str
    match_rows: list[MatchRow]
    disclaimers: list[str] = Field(default_factory=list)
