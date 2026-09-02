from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_chat_model: str = Field(default="gpt-4o-mini", alias="OPENAI_CHAT_MODEL")
    openai_embed_model: str = Field(default="text-embedding-3-small", alias="OPENAI_EMBED_MODEL")
    cors_origins: str = Field(
        default="http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
        description="Comma-separated list",
    )
    corpus_version: str = Field(default="unknown", alias="CORPUS_VERSION")
    prompt_version: str = Field(default="chat-v1", alias="PROMPT_VERSION")
    environment: str = Field(default="dev", alias="ENVIRONMENT")
    embed_mode: Literal["openai", "mock"] = Field(default="openai", alias="EMBED_MODE")
    vector_backend: Literal["in_memory", "pgvector"] = Field(default="in_memory", alias="VECTOR_BACKEND")
    database_url: str = Field(default="", alias="DATABASE_URL")
    langfuse_public_key: str = Field(default="", alias="LANGFUSE_PUBLIC_KEY")
    langfuse_secret_key: str = Field(default="", alias="LANGFUSE_SECRET_KEY")
    langfuse_host: str = Field(default="https://cloud.langfuse.com", alias="LANGFUSE_HOST")
    max_request_body_bytes: int = Field(default=512_000, alias="MAX_REQUEST_BODY_BYTES")
    rate_limit_per_minute: int = Field(default=30, alias="RATE_LIMIT_PER_MINUTE")

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


def get_settings() -> Settings:
    return Settings()
