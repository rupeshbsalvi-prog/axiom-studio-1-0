import uuid
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from apps.api.schemas.brain import BrainPlanRequest, BrainPlanResponse
from apps.api.services.brain_planner import brain_planner_service
from apps.api.core.errors import ErrorResponse, ErrorDetail

router = APIRouter()

@router.post("/brain/plan", response_model=BrainPlanResponse)
def generate_brain_plan(request: BrainPlanRequest):
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
            requestId=f"err_{uuid.uuid4().hex[:8]}"
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ErrorResponse(error=error_detail).model_dump()
        )
    except Exception as e:
        error_detail = ErrorDetail(
            code="brain_plan_failed",
            message=f"Internal planner error: {str(e)}",
            requestId=f"err_{uuid.uuid4().hex[:8]}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(error=error_detail).model_dump()
        )
