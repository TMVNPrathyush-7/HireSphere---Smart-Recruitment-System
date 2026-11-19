from fastapi import APIRouter, HTTPException
from ..models.schemas import ResumeSuggestionsRequest, ResumeSuggestionsResponse
from ..services.suggestions_service import SuggestionsService

router = APIRouter(prefix="/api/ai", tags=["Resume Suggestions"])

@router.post("/resume-suggestions", response_model=ResumeSuggestionsResponse)
async def resume_suggestions(request: ResumeSuggestionsRequest):
    try:
        suggestions = await SuggestionsService.generate_suggestions(request.candidate, request.job)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
