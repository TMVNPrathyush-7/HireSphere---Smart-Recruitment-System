from fastapi import APIRouter, HTTPException
from ..models.schemas import ResumeParseRequest, ParsedResumeResponse
from ..services.parser_service import ParserService

router = APIRouter(prefix="/api/ai", tags=["Resume Parser"])

@router.post("/parse-resume", response_model=ParsedResumeResponse)
async def parse_resume(request: ResumeParseRequest):
    try:
        result = await ParserService.parse_resume(
            file_path_or_url=request.file_url or "",
            file_name=request.file_name or "resume.pdf",
            raw_text=request.text or ""
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
