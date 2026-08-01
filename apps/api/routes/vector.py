from fastapi import APIRouter, HTTPException
from apps.api.schemas.vector import (
  VectorPlanRequest,
  VectorPlanResponse,
  VectorGenerateRequest,
  VectorGenerateResponse
)
from apps.api.services.vector_service import VectorPlannerService

router = APIRouter(prefix="/api/vector", tags=["vector"])

@router.get("/templates")
def get_vector_templates():
  return VectorPlannerService.get_templates()

@router.post("/plan", response_model=VectorPlanResponse)
def plan_vector_composition(request: VectorPlanRequest):
  try:
    return VectorPlannerService.generate_composition_plan(request)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=VectorGenerateResponse)
def generate_vector_composition(request: VectorGenerateRequest):
  try:
    return VectorPlannerService.generate_placeholder_composition(request)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
