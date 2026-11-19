from typing import List, Dict, Any

class RankingService:
    @staticmethod
    def rank_applications(applications: List[Dict[str, Any]], ats_weight: float = 0.4, skill_weight: float = 0.6) -> List[Dict[str, Any]]:
        scored = []
        for app in applications:
            ats = float(app.get("ats_score", 0))
            skill = float(app.get("skill_match_score", 0))
            composite = round((ats * ats_weight) + (skill * skill_weight), 1)

            app_copy = dict(app)
            app_copy["composite_score"] = composite
            scored.append(app_copy)

        scored.sort(key=lambda x: x["composite_score"], reverse=True)

        for idx, item in enumerate(scored):
            item["rank_position"] = idx + 1

        return scored
