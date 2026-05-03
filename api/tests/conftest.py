import os

# Must run before `app.main` is imported by test modules
os.environ.setdefault("EMBED_MODE", "mock")
os.environ.setdefault("OPENAI_API_KEY", "sk-test")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("CORPUS_VERSION", "ci")
os.environ.setdefault("CORS_ORIGINS", "http://127.0.0.1")
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "500")
