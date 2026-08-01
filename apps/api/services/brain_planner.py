from apps.api.core.config import settings
from typing import List
from apps.api.schemas.brain import BrainPlanResponse, RecommendationInfluenceSource
from apps.api.services.local_imagine_x_planner import generate_local_plan

class BrainPlannerService:
    def __init__(self):
        self.provider_mode = settings.AXIOM_BRAIN_PROVIDER

    def generate_plan(
        self,
        intent: str,
        recommendation_influences: List[str] | None = None,
        recommendation_influence_source: RecommendationInfluenceSource | None = None,
    ) -> BrainPlanResponse:
        if self.provider_mode in {"local", "mock"}:
            return generate_local_plan(intent, recommendation_influences, recommendation_influence_source)
        elif self.provider_mode == "disabled":
            raise ValueError("Axiom Brain planning service is currently disabled.")
        else:
            return generate_local_plan(intent, recommendation_influences, recommendation_influence_source)

brain_planner_service = BrainPlannerService()
