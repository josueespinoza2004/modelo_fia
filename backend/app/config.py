from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Cargar variables desde backend/.env y luego desde ../.env.local sin sobreescribir
load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env.local")


class Settings:
    """Configuración centralizada del backend FastAPI."""

    APP_NAME: str = "AURA Coffee Roasters API"
    APP_VERSION: str = "2.0.0"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    DATABASE_PATH: Path = BASE_DIR / "data" / "aura.db"
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()

