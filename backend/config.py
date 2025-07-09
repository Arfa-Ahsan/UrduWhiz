from pydantic_settings import BaseSettings 
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    MAIL_FROM: str
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_SSL_TLS: bool = True
    FASTAPI_SECRET_KEY: str
    
    # ADDED: RAG and AI service environment variables
    GEMINI_API_KEY: str
    QDRANT_URL: str
    QDRANT_API_KEY: str
    GOOGLE_APPLICATION_CREDENTIALS: str
    HF_HOME: str

    class Config:
        env_file = ".env"

settings = Settings()