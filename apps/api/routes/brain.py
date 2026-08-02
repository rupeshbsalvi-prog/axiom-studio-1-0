from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from apps.api.schemas.brain import BrainPlanRequest, BrainPlanResponse
from apps.api.services.brain_planner import brain_planner_service
from apps.api.core.errors import ErrorResponse, ErrorDetail
from apps.api.routes.dependencies import require_workspace_authority

router = APIRouter()

@router.post("/brain/plan", response_model=BrainPlanResponse)
def generate_brain_plan(
    request: BrainPlanRequest,
    http_request: Request,
    _membership=Depends(require_workspace_authority),
):
    try:
        return brain_planner_service.generate_plan(
            request.intent,
            request.recommendationInfluences,
            request.recommendationInfluenceSource,
        )
    except ValueError as e:
        error_detail = ErrorDetail(
            code="brain_plan_disabled",
            message=str(e),
            requestId=http_request.state.request_id
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ErrorResponse(error=error_detail).model_dump()
        )
