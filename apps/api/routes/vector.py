from fastapi import APIRouter, Depends
from apps.api.schemas.vector import (
  VectorPlanRequest,
  VectorPlanResponse,
  VectorGenerateRequest,
  VectorGenerateResponse
)
from apps.api.services.vector_service import VectorPlannerService
from apps.api.routes.dependencies import require_workspace_authority

router = APIRouter(prefix="/api/vector", tags=["vector"])

@router.get("/templates")
def get_vector_templates():
  return VectorPlannerService.get_templates()

@router.post("/plan", response_model=VectorPlanResponse)
def plan_vector_composition(request: VectorPlanRequest, _membership=Depends(require_workspace_authority)):
  return VectorPlannerService.generate_composition_plan(request)

@router.post("/generate", response_model=VectorGenerateResponse)
def generate_vector_composition(request: VectorGenerateRequest, _membership=Depends(require_workspace_authority)):
  return VectorPlannerService.generate_placeholder_composition(request)
