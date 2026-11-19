from typing import List, Dict, Any

SYNONYM_MAP = {
    "react": ["reactjs", "react.js", "react-native"],
    "node.js": ["nodejs", "node", "node js"],
    "typescript": ["ts"],
    "javascript": ["js", "es6", "ecmascript"],
    "python": ["py", "python3"],
    "postgresql": ["postgres", "pgsql", "psql"],
    "docker": ["containers", "containerization"],
    "kubernetes": ["k8s", "kube"],
    "aws": ["amazon web services", "amazon cloud"],
    "machine learning": ["ml", "deep learning"],
    "fastapi": ["fast api"],
    "rest apis": ["rest", "restful", "rest api"],
    "tailwind css": ["tailwind", "tailwindcss"],
    "vue.js": ["vue", "vuejs"],
    "mongodb": ["mongo", "nosql"],
    "llm": ["large language models", "generative ai", "genai", "prompt engineering"]
}

def are_skills_equivalent(s1: str, s2: str) -> bool:
    norm1 = s1.lower().strip()
    norm2 = s2.lower().strip()

    if norm1 == norm2:
        return True

    if norm1 in norm2 or norm2 in norm1:
        return True

    for canonical, synonyms in SYNONYM_MAP.items():
        all_variants = [canonical] + synonyms
        if norm1 in all_variants and norm2 in all_variants:
            return True

    return False

class MatcherService:
    @staticmethod
    def match_skills(candidate_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
        if not required_skills:
            return {
                "match_percentage": 100,
                "matched_skills": candidate_skills,
                "missing_skills": []
            }

        matched = []
        missing = []

        for req in required_skills:
            is_matched = False
            for cand in candidate_skills:
                if are_skills_equivalent(req, cand):
                    is_matched = True
                    matched.append(req)
                    break
            if not is_matched:
                missing.append(req)

        match_pct = int(round((len(matched) / len(required_skills)) * 100))

        return {
            "match_percentage": match_pct,
            "matched_skills": matched,
            "missing_skills": missing
        }
