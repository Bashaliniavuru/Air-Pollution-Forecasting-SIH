from typing import List, Optional
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Air Pollution-Weather Coupled Forecasting System (Delhi-NCR)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    FOCUS_REGION: str = "Delhi-NCR"
    
    # Google Gemini API Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Frontend / CORS Configuration
    FRONTEND_URL: Optional[str] = None
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    def get_cors_origins(self) -> List[str]:
        """Returns normalized CORS origins list including FRONTEND_URL if provided."""
        origins = list(self.CORS_ORIGINS)
        if self.FRONTEND_URL:
            clean_front = self.FRONTEND_URL.strip().rstrip("/")
            if clean_front and clean_front not in origins:
                origins.append(clean_front)
        return origins

    # Host & Port settings
    HOST: str = "0.0.0.0"
    PORT: int = int(os.environ.get("PORT", 10000))

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", os.path.join(os.path.dirname(__file__), ".env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

