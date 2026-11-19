from typing import Dict, Any, List
import json
import re

class AtsService:
    @staticmethod
    def calculate_score(candidate: Dict[str, Any], job: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Calculates the ATS Compatibility & Resume Quality Score across 5 weighted components (Total 100%):
        1. Resume parsing compatibility (25%)
        2. Section structure and organization (20%)
        3. Keyword optimization (25%)
        4. Content completeness (15%)
        5. Formatting and readability (15%)
        
        Evaluation Tiers:
        - 95-100: Excellent (ATS Optimized)
        - 85-94:  Very Good (High Compatibility)
        - 70-84:  Needs Improvement (Moderate)
        - 50-69:  Poor (High Rejection Risk)
        - Below 50: Major Issues (Parsing Deficits)
        """
        passed_checks = []
        issues_flagged = []

        # Safe parsing of potential stringified JSONs
        skills = candidate.get("skills", [])
        if isinstance(skills, str):
            try:
                skills = json.loads(skills)
            except Exception:
                skills = []

        headline = candidate.get("headline", "") or ""
        summary = candidate.get("summary", "") or candidate.get("experience_summary", "") or ""
        name = candidate.get("name", "") or ""
        email = candidate.get("email", "") or ""
        phone = candidate.get("phone", "") or ""
        linkedin = candidate.get("linkedin_url", "") or ""
        github = candidate.get("github_url", "") or ""
        portfolio = candidate.get("portfolio_url", "") or ""

        experience = candidate.get("work_experience", [])
        if isinstance(experience, str):
            try:
                experience = json.loads(experience)
            except Exception:
                experience = []

        # For student candidates / early career, projects serve as hands-on experience
        if not experience or len(experience) == 0:
            projects = candidate.get("projects", [])
            if isinstance(projects, str):
                try:
                    projects = json.loads(projects)
                except Exception:
                    projects = []
            if projects:
                experience = projects

        education = candidate.get("education", [])
        if isinstance(education, str):
            try:
                education = json.loads(education)
            except Exception:
                education = []

        # -------------------------------------------------------------
        # Parameter 1: Resume Parsing Compatibility (Weight: 25%)
        # -------------------------------------------------------------
        p1 = 0
        if email and "@" in str(email):
            p1 += 5
        if phone and len(str(phone).strip()) >= 7:
            p1 += 5
        if linkedin or github or portfolio:
            p1 += 5
        if name and len(str(name).strip()) >= 3:
            p1 += 10  # Clean text & identity extraction successful
        p1 = min(25, p1)

        if p1 >= 20:
            passed_checks.append("Parsing Compatibility: Verified contact headers and social/code profile links.")
        else:
            issues_flagged.append("Parsing Compatibility: Missing direct contact or portfolio links.")

        # -------------------------------------------------------------
        # Parameter 2: Section Structure & Organization (Weight: 20%)
        # -------------------------------------------------------------
        p2 = 0
        if name:
            p2 += 4  # Contact / Identification header present
        if headline and len(str(headline).strip()) >= 8:
            p2 += 4  # Professional headline defined
        if summary and len(str(summary).strip()) >= 20:
            p2 += 4  # Executive summary / bio structured
        if experience and len(experience) > 0:
            p2 += 4  # Experience / Projects chronology present
        if education and len(education) > 0:
            p2 += 4  # Education section present
        p2 = min(20, p2)

        if p2 >= 16:
            passed_checks.append("Section Structure: Clear chronological division across summary, skills, projects, and education.")
        else:
            issues_flagged.append("Section Structure: Missing standard resume sections.")

        # -------------------------------------------------------------
        # Parameter 3: Keyword Optimization (Weight: 25%)
        # -------------------------------------------------------------
        p3 = 0
        if len(skills) >= 10:
            p3 += 15
        elif len(skills) >= 6:
            p3 += 12
        elif len(skills) >= 3:
            p3 += 7
        elif len(skills) >= 1:
            p3 += 4

        # Keyword alignment with job or broad industry tech stack
        if job and job.get("required_skills"):
            req_skills = job.get("required_skills", [])
            overlap = [rs for rs in req_skills if any(cs.lower() in rs.lower() or rs.lower() in cs.lower() for cs in skills)]
            ratio = len(overlap) / max(1, len(req_skills))
            p3 += int(round(ratio * 10))
            if ratio >= 0.7:
                passed_checks.append(f"Keyword Density: High alignment ({len(overlap)} of {len(req_skills)} required technical skills matched).")
            elif ratio < 0.4:
                issues_flagged.append("Keyword Density: Missing target competencies for this specific role.")
        else:
            p3 += 10 if len(skills) >= 8 else 6
            passed_checks.append(f"Keyword Optimization: {len(skills)} competencies indexed across frameworks and databases.")
        p3 = min(25, p3)

        # -------------------------------------------------------------
        # Parameter 4: Content Completeness (Weight: 15%)
        # -------------------------------------------------------------
        p4 = 0
        if education and any(isinstance(e, dict) and e.get("degree") and e.get("institution") for e in education):
            p4 += 5
            if any(isinstance(e, dict) and (e.get("score") or e.get("cgpa") or e.get("year")) for e in education):
                p4 += 3
        if experience and any(isinstance(e, dict) and (e.get("title") or e.get("role")) for e in experience):
            p4 += 4
            if any(isinstance(e, dict) and len(str(e.get("description", ""))) > 25 for e in experience):
                p4 += 3
        p4 = min(15, p4)

        if p4 >= 12:
            passed_checks.append("Content Completeness: Accredited education with grades and structured project records documented.")
        else:
            issues_flagged.append("Content Completeness: Project or academic records lack descriptions or metrics.")

        # -------------------------------------------------------------
        # Parameter 5: Formatting & Readability (Weight: 15%)
        # -------------------------------------------------------------
        p5 = 0
        all_text = " ".join([
            summary,
            " ".join([str(e.get("description", "")) for e in experience if isinstance(e, dict)])
        ]).lower()

        power_verbs = ["architected", "developed", "built", "reduced", "increased", "optimized", "scaled", "implemented", "designed", "integrated", "engineered"]
        if any(v in all_text for v in power_verbs):
            p5 += 8

        if re.search(r'\d+%|\d+\s*(ms|k|m|users|sec|seconds|times|x|gb|mb)|\d+', all_text):
            p5 += 7
        p5 = min(15, p5)

        if p5 >= 12:
            passed_checks.append("Formatting & Readability: Action verbs and quantifiable performance metrics detected.")
        else:
            issues_flagged.append("Formatting & Readability: Descriptions lack quantifiable numbers or action verbs.")

        total_score = p1 + p2 + p3 + p4 + p5
        total_score = min(100, max(20, total_score))

        # Scientific 5-Tier ATS Compatibility Grade
        if total_score >= 95:
            grade = "Excellent"
            grade_desc = "ATS Optimized"
        elif total_score >= 85:
            grade = "Very Good"
            grade_desc = "High Compatibility"
        elif total_score >= 70:
            grade = "Needs Improvement"
            grade_desc = "Moderate Compatibility"
        elif total_score >= 50:
            grade = "Poor"
            grade_desc = "High Rejection Risk"
        else:
            grade = "Major Issues"
            grade_desc = "Critical Deficits"

        return {
            "ats_compatibility_score": total_score,
            "ats_score": total_score,  # Backwards-compatible for callers
            "grade": grade,
            "grade_description": grade_desc,
            "components": {
                "parsing_compatibility": {"score": p1, "max": 25, "weight": "25%", "label": "Resume Parsing Compatibility"},
                "section_structure": {"score": p2, "max": 20, "weight": "20%", "label": "Section Structure & Organization"},
                "keyword_optimization": {"score": p3, "max": 25, "weight": "25%", "label": "Keyword Optimization"},
                "content_completeness": {"score": p4, "max": 15, "weight": "15%", "label": "Content Completeness"},
                "formatting_readability": {"score": p5, "max": 15, "weight": "15%", "label": "Formatting & Readability"}
            },
            "passed_checks": passed_checks,
            "issues_flagged": issues_flagged,
            "details": {
                "format_rating": grade,
                "parsing_confidence": "High" if p1 >= 20 else "Medium",
                "total_skills_detected": len(skills)
            }
        }
