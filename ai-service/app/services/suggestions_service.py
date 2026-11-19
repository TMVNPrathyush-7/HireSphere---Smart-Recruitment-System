from typing import Dict, Any, List
import json
from .matcher_service import MatcherService
from ..llm.llm_client import LlmClient
from ..config import settings

LEARNING_PATHWAYS = {
    "Docker": "Master Docker containerization with interactive Katacoda labs & official Docker Captain tutorials.",
    "Kubernetes": "Study K8s Architecture, Pod lifecycle, Services, Ingress, and Helm charts via KubeAcademy.",
    "AWS": "Prepare with AWS Certified Solutions Architect Associate syllabus and AWS Hands-On Labs.",
    "TypeScript": "Explore Generics, Utility Types, and Strict Type Checking with 'Total TypeScript'.",
    "Python": "Build backend APIs with Pydantic, Asyncio, and PyTest; study clean architecture patterns.",
    "FastAPI": "Review the official FastAPI interactive OpenAPI tutorial and asynchronous database connections.",
    "PyTorch": "Complete the 'Deep Learning with PyTorch' 60-minute blitz and torchvision model fine-tuning.",
    "LLM": "Learn LangChain, LlamaIndex, RAG architectures, and vector embeddings from DeepLearning.AI.",
    "PostgreSQL": "Master indexing strategies, EXPLAIN ANALYZE query planning, and connection pooling.",
    "GraphQL": "Practice schema design, resolvers, DataLoader N+1 mitigation, and Apollo Client.",
    "React": "Study React 18/19 Server Components, Suspense, Custom Hooks, and state management patterns.",
    "Node.js": "Deep-dive into Event Loop, Worker Threads, Streams, and modular microservice design.",
    "Redis": "Learn in-memory caching strategies, pub/sub messaging, and distributed rate limiting."
}

class SuggestionsService:
    @staticmethod
    async def generate_suggestions(candidate: Dict[str, Any], job: Dict[str, Any] = None) -> List[Dict[str, str]]:
        # 1. Live LLM AI Analysis (Gemini)
        if settings.GEMINI_API_KEY:
            try:
                candidate_summary = {
                    "headline": candidate.get("headline", ""),
                    "summary": candidate.get("summary") or candidate.get("experience_summary", ""),
                    "skills": candidate.get("skills", []),
                    "projects": candidate.get("projects", []),
                    "work_experience": candidate.get("work_experience", []),
                    "education": candidate.get("education", [])
                }
                job_context = f"Target Role: {job.get('title', '')} with required skills {job.get('required_skills', [])}" if job else "General Software Engineering, Full-Stack, and AI roles"
                
                prompt = f"""You are an elite ATS resume optimizer and engineering career coach.
Review the following candidate's actual resume data:
{json.dumps(candidate_summary, indent=2)}

Target Context: {job_context}

Provide 3 to 4 personalized, highly actionable ATS recommendations.
Crucial rule: Mention their actual project titles (e.g. Travel Booking App, RAG-Based News Article Summarizer) or real technologies (e.g. MongoDB, ChromaDB, Java, Python) in your advice so the feedback is authentic and personalized.

Return a valid JSON array of objects strictly matching:
[
  {{
    "category": "e.g. Project Impact & Metrics",
    "advice": "Clear, specific advice referring to their exact projects or technologies...",
    "impact": "High"
  }}
]
"""
                ai_advice = await LlmClient.generate_json(prompt, "You are an expert ATS resume reviewer. Return valid JSON only.")
                if ai_advice and isinstance(ai_advice, list) and len(ai_advice) > 0:
                    formatted = []
                    for item in ai_advice:
                        if isinstance(item, dict) and "advice" in item:
                            formatted.append({
                                "category": str(item.get("category", "Resume Optimization")),
                                "advice": str(item.get("advice", "")),
                                "impact": str(item.get("impact", "High"))
                            })
                    if formatted:
                        return formatted
            except Exception as e:
                print(f"[SuggestionsService] LLM suggestions failed, using heuristic: {e}")

        # 2. Heuristic Rubric Fallback
        suggestions = []
        skills = candidate.get("skills", [])
        experience = candidate.get("work_experience", [])
        headline = candidate.get("headline", "")

        suggestions.append({
            "category": "Impact & Action Verbs",
            "advice": "Replace passive language ('was responsible for', 'worked on') with authoritative verbs such as 'Architected', 'Spearheaded', 'Optimized', and 'Engineered'.",
            "impact": "High"
        })

        has_metrics = False
        for exp in experience:
            desc = exp.get("description", "")
            if any(char.isdigit() for char in desc):
                has_metrics = True
                break

        if not has_metrics or len(experience) == 0:
            suggestions.append({
                "category": "Quantified Metrics",
                "advice": "Add measurable data to your achievements (e.g., 'Reduced response latency by 42%', 'Managed $100k cloud infrastructure', 'Automated QA testing saving 15 dev-hours weekly').",
                "impact": "High"
            })
        else:
            suggestions.append({
                "category": "Quantified Metrics",
                "advice": "Maintain a strong metric ratio: aim for at least one numerical metric per two bullet points across all recent roles.",
                "impact": "Medium"
            })

        if job:
            req_skills = job.get("required_skills", [])
            missing = [s for s in req_skills if not any(s.lower() in cs.lower() for cs in skills)]
            if missing:
                suggestions.append({
                    "category": "Target Role Keyword Alignment",
                    "advice": f"Tailor your resume for this position by prominently featuring missing target skills: {', '.join(missing[:3])}.",
                    "impact": "High"
                })
        else:
            suggestions.append({
                "category": "Section Organization",
                "advice": "Ensure clear standard section headers: 'Summary', 'Technical Skills', 'Notable Projects', 'Education', and 'Certifications'.",
                "impact": "Medium"
            })

        if not headline or len(headline) < 15:
            suggestions.append({
                "category": "Professional Branding",
                "advice": "Create an impactful headline highlighting your seniority level and core stack (e.g., 'Full Stack Engineer | React, Node.js, Python').",
                "impact": "Medium"
            })

        return suggestions

    @staticmethod
    def analyze_skill_gap(candidate_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
        match_result = MatcherService.match_skills(candidate_skills, required_skills)
        missing_skills = match_result["missing_skills"]

        recommendations = []
        for skill in missing_skills:
            rec_text = LEARNING_PATHWAYS.get(
                skill,
                f"Complete hands-on reference tutorials and build a showcase portfolio repository utilizing {skill}."
            )
            recommendations.append({
                "skill": skill,
                "priority": "High" if skill in required_skills[:3] else "Medium",
                "recommendation": rec_text
            })

        return {
            "match_percentage": match_result["match_percentage"],
            "matched_skills": match_result["matched_skills"],
            "missing_skills": missing_skills,
            "recommendations": recommendations
        }
