from fastapi import APIRouter
from apps.api.schemas.providers import ProviderStatusResponse, ProviderItem

router = APIRouter()

@router.get("/providers/status", response_model=ProviderStatusResponse)
def get_providers_status():
    return ProviderStatusResponse(
        providers=[
            ProviderItem(
                id="local-brain",
                name="Local Imagine X Planner",
                type="planner",
                status="active",
                mode="local",
                errorRate=0.0,
                latencyMs=20
            ),
            ProviderItem(
                id="axiom-imagine-x",
                name="Axiom Imagine X",
                type="imagination",
                status="active",
                mode="local",
                errorRate=0.0,
                latencyMs=45
            )
        ]
    )
