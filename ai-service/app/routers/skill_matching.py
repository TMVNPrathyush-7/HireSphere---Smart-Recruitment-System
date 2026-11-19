from fastapi import APIRouter, HTTPException
from ..models.schemas import SkillMatchRequest, SkillMatchResponse, SkillGapRequest, SkillGapResponse
from ..services.matcher_service import MatcherService
from ..services.suggestions_service import SuggestionsService

router = APIRouter(prefix="/api/ai", tags=["Skill Matching"])

@router.post("/skill-match", response_model=SkillMatchResponse)
async def skill_match(request: SkillMatchRequest):
    try:
        result = MatcherService.match_skills(request.candidate_skills, request.required_skills)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/skill-gap", response_model=SkillGapResponse)
async def skill_gap(request: SkillGapRequest):
    try:
        result = SuggestionsService.analyze_skill_gap(request.candidate_skills, request.required_skills)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
