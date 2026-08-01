from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": "axiom-api",
        "version": "0.1.0",
        "environment": "development"
    }
