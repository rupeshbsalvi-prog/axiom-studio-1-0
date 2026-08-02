from typing import List, Literal, Union
from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    AXIOM_ENVIRONMENT: Literal["development", "test", "production"] = "development"
    AXIOM_ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    AXIOM_ALLOWED_METHODS: Union[str, List[str]] = "GET,POST,OPTIONS"
    AXIOM_ALLOWED_HEADERS: Union[str, List[str]] = "Content-Type,Authorization"
    AXIOM_BRAIN_PROVIDER: str = "local"
    AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN: str = ""
    AXIOM_PHOTO_PROVIDER_API_KEY: str = ""
    AXIOM_ASSET_SIGNING_SECRET: str = ""
    AXIOM_PHOTO_GATEWAY_RATE_LIMIT: int = 5
    AXIOM_PHOTO_GATEWAY_SESSION_TTL_SECONDS: int = 900
    AXIOM_RUNTIME_DATA_DIR: str = ".axiom-runtime"
    AXIOM_PERSISTENCE_BACKEND: Literal["local", "supabase"] = "local"
    AXIOM_SECURE_COOKIES: bool = False
    # Phase 29 — Async Provider Job Lifecycle
    # Backend-only. AXIOM_PHOTO_PROVIDER_ENDPOINT and AXIOM_PHOTO_PROVIDER_API_KEY
    # must NEVER appear in API responses, diagnostics, audit metadata, or logs.
    AXIOM_ENABLE_STUB_REAL_PROVIDER: bool = False
    AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER: bool = False
    AXIOM_PHOTO_PROVIDER_ENDPOINT: str = ""

    AXIOM_JOB_STALE_SECONDS: int = 300
    AXIOM_WORKSPACE_ID: str = "local-workspace"
    AXIOM_WORKSPACE_LEARNING_ALLOWED: bool = True
    AXIOM_WORKSPACE_POLICY_REQUIRED: bool = False
    # Auth A1 — all Supabase credentials and tokens remain server-side.
    AXIOM_SUPABASE_URL: str = ""
    AXIOM_SUPABASE_PUBLISHABLE_KEY: SecretStr = SecretStr("")
    AXIOM_SUPABASE_SECRET_KEY: SecretStr = SecretStr("")
    AXIOM_AUTH_OAUTH_PROVIDER: str = "google"
    AXIOM_AUTH_CALLBACK_URL: str = "http://localhost:8000/api/auth/callback"
    AXIOM_AUTH_POST_LOGIN_REDIRECT: str = "http://localhost:5173/"
    AXIOM_AUTH_FLOW_TTL_SECONDS: int = 300
    AXIOM_AUTH_SESSION_TTL_SECONDS: int = 900
    AXIOM_AUTH_LOGIN_RATE_LIMIT: int = Field(default=10, ge=1, le=100)
    AXIOM_AUTH_LOGIN_RATE_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)
    AXIOM_ASSET_RETENTION_SECONDS: int = Field(default=604800, ge=300, le=31536000)

    @field_validator("AXIOM_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("AXIOM_ALLOWED_METHODS", "AXIOM_ALLOWED_HEADERS", mode="before")
    @classmethod
    def parse_csv_list(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    @field_validator("AXIOM_ALLOWED_ORIGINS")
    @classmethod
    def reject_credentialed_wildcard_origin(cls, v: List[str]) -> List[str]:
        if "*" in v:
            raise ValueError("AXIOM_ALLOWED_ORIGINS cannot contain '*' while credentialed CORS is enabled.")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
