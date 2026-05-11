from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "apexcare_db"
    SECRET_KEY: str = "your_secret_key_here"  # Should be changed in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (1 day)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://apexcare-management.vercel.app"

    # SMTP Settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "ApexCare Hospital <no-reply@apexcare.com>"

    class Config:
        env_file = ".env"

settings = Settings()
