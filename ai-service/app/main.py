import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import (
    resume_parser,
    ats_scoring,
    skill_matching,
    ranking,
    suggestions,
    mock_interview
)

app = FastAPI(
    title="HireSphere AI Service",
    description="Dedicated Python AI & NLP microservice for resume parsing, ATS scoring, skill matching, candidate ranking, and mock interview generation.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HireSphere AI Service (Python FastAPI)",
        "version": "1.0.0",
        "ocr_engine": "pypdf + python-docx",
        "llm_ready": bool(settings.OPENAI_API_KEY or settings.GEMINI_API_KEY)
    }

# Include all modular routers
app.include_router(resume_parser.router)
app.include_router(ats_scoring.router)
app.include_router(skill_matching.router)
app.include_router(ranking.router)
app.include_router(suggestions.router)
app.include_router(mock_interview.router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
