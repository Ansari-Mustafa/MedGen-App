from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Database
    database_url: str = ""  # postgresql+asyncpg://...

    # Redis / ARQ
    redis_url: str = "redis://localhost:6379"

    # AI providers
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # STT providers
    elevenlabs_api_key: str = ""
    deepgram_api_key: str = ""
    google_api_key: str = ""

    # Provider selection (swappable)
    stt_provider: str = "elevenlabs"   # elevenlabs | deepgram | assemblyai
    stt_fallback_to_gemini: bool = True
    ai_provider: str = "anthropic"     # anthropic | openai
    ai_model: str = "claude-opus-4-6"

    # App
    app_name: str = "MedGen API"
    debug: bool = False
    cors_origins: list[str] = ["*"]

    # Public-facing URL (used by mobile to form WebSocket / API URLs)
    # Local dev: set to your ngrok HTTPS URL, e.g. https://abc123.ngrok.io
    api_base_url: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
