from fastapi import APIRouter, Response, status

from apps.api.core.config import settings
from apps.api.services.supabase_persistence import SupabasePersistence

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": "axiom-api",
        "version": "0.1.0",
        "environment": settings.AXIOM_ENVIRONMENT
    }


def check_persistence_ready() -> bool:
    if settings.AXIOM_PERSISTENCE_BACKEND == "local":
        return True
    base_url = settings.AXIOM_SUPABASE_URL.rstrip("/")
    secret_key = settings.AXIOM_SUPABASE_SECRET_KEY.get_secret_value()
    if not base_url or not secret_key:
        return False
    return SupabasePersistence(base_url, secret_key).check_ready()


@router.get("/ready")
def get_readiness(response: Response):
    try:
        ready = check_persistence_ready()
    except Exception:
        ready = False
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unavailable"}
    return {"status": "ready"}
