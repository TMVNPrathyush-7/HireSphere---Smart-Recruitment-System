from fastapi import APIRouter, HTTPException
from ..models.schemas import AtsScoreRequest, AtsScoreResponse
from ..services.ats_service import AtsService

router = APIRouter(prefix="/api/ai", tags=["ATS Scoring"])

@router.post("/ats-score", response_model=AtsScoreResponse)
async def ats_score(request: AtsScoreRequest):
    try:
        result = AtsService.calculate_score(request.candidate, request.job)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
