from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ResumeParseRequest(BaseModel):
    file_url: Optional[str] = None
    file_name: Optional[str] = "resume.pdf"
    text: Optional[str] = ""

class ParsedResumeResponse(BaseModel):
    name: str
    headline: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    github_url: Optional[str] = ""
    portfolio_url: Optional[str] = ""
    experience_summary: str
    skills: List[str]
    projects: List[Dict[str, Any]] = []
    work_experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    ats_readiness: int



class AtsScoreRequest(BaseModel):
    candidate: Dict[str, Any]
    job: Optional[Dict[str, Any]] = None

class AtsScoreResponse(BaseModel):
    ats_score: int
    passed_checks: List[str]
    issues_flagged: List[str]
    details: Dict[str, Any] = {}

class SkillMatchRequest(BaseModel):
    candidate_skills: List[str] = []
    required_skills: List[str] = []

class SkillMatchResponse(BaseModel):
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]

class CandidateRankingRequest(BaseModel):
    applications: List[Dict[str, Any]]
    ats_weight: Optional[float] = 0.4
    skill_weight: Optional[float] = 0.6

class ResumeSuggestionsRequest(BaseModel):
    candidate: Dict[str, Any]
    job: Optional[Dict[str, Any]] = None

class ResumeSuggestionItem(BaseModel):
    category: str
    advice: str
    impact: str

class ResumeSuggestionsResponse(BaseModel):
    suggestions: List[ResumeSuggestionItem]

class SkillGapRequest(BaseModel):
    candidate_skills: List[str] = []
    required_skills: List[str] = []

class SkillGapRecommendation(BaseModel):
    skill: str
    priority: str
    recommendation: str

class SkillGapResponse(BaseModel):
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[SkillGapRecommendation]

class MockInterviewRequest(BaseModel):
    role: Optional[str] = "Software Engineer"
    skills: Optional[List[str]] = []

class MockInterviewQuestionItem(BaseModel):
    id: int
    question: str
    type: str
    difficulty: str
    sample_answer: str
    evaluation_criteria: str

class MockInterviewResponse(BaseModel):
    role: str
    questions: List[MockInterviewQuestionItem]

class EvaluateAnswerRequest(BaseModel):
    role: Optional[str] = "Software Engineer"
    question: str
    sample_answer: Optional[str] = ""
    evaluation_criteria: Optional[str] = ""
    user_answer: str

class EvaluateAnswerResponse(BaseModel):
    score: float
    rating: str
    strengths: List[str] = []
    missing_key_concepts: List[str] = []
    actionable_feedback: str

class InteractiveTurnHistoryItem(BaseModel):
    speaker: str  # "interviewer" or "candidate"
    text: str

class InteractiveFinalEvaluation(BaseModel):
    overall_score: float
    rating: str
    technical_depth: str
    communication: str
    key_strengths: List[str] = []
    growth_areas: List[str] = []

class InteractiveInterviewTurnRequest(BaseModel):
    role: Optional[str] = "Software Engineer"
    company: Optional[str] = "General Tech"
    skills: Optional[List[str]] = []
    turn: int = 1
    total_turns: Optional[int] = 4
    resume_data: Optional[Dict[str, Any]] = None
    history: List[InteractiveTurnHistoryItem] = []

class InteractiveInterviewTurnResponse(BaseModel):
    interviewer_name: str = "Alex (Staff Technical Lead)"
    feedback_snippet: Optional[str] = ""
    next_question: Optional[str] = ""
    is_final: bool = False
    final_evaluation: Optional[InteractiveFinalEvaluation] = None


