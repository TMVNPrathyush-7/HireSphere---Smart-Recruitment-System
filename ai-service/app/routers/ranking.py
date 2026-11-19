from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..models.schemas import CandidateRankingRequest
from ..services.ranking_service import RankingService

router = APIRouter(prefix="/api/ai", tags=["Candidate Ranking"])

@router.post("/rank-candidates", response_model=List[Dict[str, Any]])
async def rank_candidates(request: CandidateRankingRequest):
    try:
        result = RankingService.rank_applications(
            applications=request.applications,
            ats_weight=request.ats_weight or 0.4,
            skill_weight=request.skill_weight or 0.6
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
