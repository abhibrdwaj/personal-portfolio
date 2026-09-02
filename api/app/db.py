from typing import Sequence

import asyncpg


async def create_pool(database_url: str) -> asyncpg.Pool:
    """Create an asyncpg connection pool for the pgvector retrieval backend."""
    return await asyncpg.create_pool(dsn=database_url, min_size=1, max_size=5)


def embedding_to_pgvector(embedding: Sequence[float]) -> str:
    """Format an embedding as pgvector's text literal, e.g. '[0.1,0.2,0.3]'.

    asyncpg has no built-in codec for pgvector's `vector` type, so a raw
    Python list bound to a `$N::vector` parameter fails with
    `DataError: invalid input for query argument $N: [...] (expected str, got list)`.
    Passing this string instead lets Postgres parse it via the `vector` cast.
    """
    return "[" + ",".join(repr(float(x)) for x in embedding) + "]"
