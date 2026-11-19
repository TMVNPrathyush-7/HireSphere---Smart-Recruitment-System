import os
from dotenv import load_dotenv

# Load .env file from ai-service directory or project root
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_ATS_WEIGHT: float = float(os.getenv("ATS_WEIGHT", 0.4))
    DEFAULT_SKILL_WEIGHT: float = float(os.getenv("SKILL_WEIGHT", 0.6))

settings = Settings()

