from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    MockInterviewRequest,
    MockInterviewResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    InteractiveInterviewTurnRequest,
    InteractiveInterviewTurnResponse
)
from ..services.interview_service import InterviewService

router = APIRouter(prefix="/api/ai", tags=["Mock Interview"])

@router.post("/mock-interview-questions", response_model=MockInterviewResponse)
async def mock_interview_questions(request: MockInterviewRequest):
    try:
        questions = await InterviewService.generate_questions(
            role=request.role or "Software Engineer",
            skills=request.skills or []
        )
        return {"role": request.role or "Software Engineer", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-interview-answer", response_model=EvaluateAnswerResponse)
async def evaluate_interview_answer(request: EvaluateAnswerRequest):
    try:
        result = await InterviewService.evaluate_answer(
            role=request.role or "Software Engineer",
            question=request.question,
            sample_answer=request.sample_answer or "",
            criteria=request.evaluation_criteria or "",
            user_answer=request.user_answer or ""
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interactive-interview-turn", response_model=InteractiveInterviewTurnResponse)
async def interactive_interview_turn(request: InteractiveInterviewTurnRequest):
    try:
        history_dicts = [{"speaker": h.speaker, "text": h.text} for h in request.history]
        result = await InterviewService.interactive_turn(
            role=request.role or "Software Engineer",
            company=request.company or "General Tech",
            skills=request.skills or [],
            turn=request.turn,
            total_turns=request.total_turns or 4,
            resume_data=request.resume_data or {},
            history=history_dicts
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


