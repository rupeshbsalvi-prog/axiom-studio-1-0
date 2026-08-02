from fastapi import APIRouter, Cookie, Header, HTTPException, Request, Response
from fastapi.responses import FileResponse
from apps.api.schemas.photo import (
  PhotoPlanRequest,
  PhotoPlanResponse,
  PhotoGenerateRequest,
  PhotoGenerateResponse,
  PhotoGatewayRequest,
  PhotoGatewayResponse,
  PhotoProviderJobEnqueueResponse,
  PhotoProviderJobStatusResponse,
)
from apps.api.services.photo_service import PhotoPlannerService
from apps.api.core.config import settings
from apps.api.services.photo_gateway import (
  SESSION_COOKIE_NAME,
  authorize_photo_gateway,
  cancel_photo_gateway_job,
  create_photo_gateway_session,
  enqueue_photo_gateway_job,
  execute_photo_gateway,
  poll_photo_gateway_job,
  resolve_signed_asset,
  revoke_photo_gateway_session,
  _get_store,
)
from apps.api.services.supabase_persistence import StoredAsset

router = APIRouter(prefix="/api/photo", tags=["photo"])

@router.get("/templates")
def get_photo_templates():
  return PhotoPlannerService.get_templates()

@router.post("/plan", response_model=PhotoPlanResponse)
def plan_photo_composition(request: PhotoPlanRequest):
  try:
    return PhotoPlannerService.generate_composition_plan(request)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=PhotoGenerateResponse)
def generate_photo_composition(request: PhotoGenerateRequest):
  try:
    return PhotoPlannerService.generate_placeholder_composition(request)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Phase 29 — Async job queue routes (POST /provider-gateway returns 202)
# ---------------------------------------------------------------------------


@router.post("/provider-session", status_code=204)
def create_provider_session(response: Response, authorization: str | None = Header(default=None)):
  token = create_photo_gateway_session(authorization)
  response.set_cookie(
    SESSION_COOKIE_NAME,
    token,
    httponly=True,
    secure=settings.AXIOM_SECURE_COOKIES,
    samesite="strict",
    max_age=settings.AXIOM_PHOTO_GATEWAY_SESSION_TTL_SECONDS,
    path="/api/photo",
  )


@router.delete("/provider-session", status_code=204)
def delete_provider_session(
  response: Response,
  axiom_photo_gateway_session: str | None = Cookie(default=None),
):
  revoke_photo_gateway_session(axiom_photo_gateway_session)
  response.delete_cookie(SESSION_COOKIE_NAME, path="/api/photo")


@router.get("/assets/{asset_id}")
def get_provider_asset(asset_id: str, expires: int, signature: str):
  if len(asset_id) != 32 or any(character not in "0123456789abcdef" for character in asset_id):
    raise HTTPException(status_code=404, detail="Asset not found.")
  
  # Perform signature and expiry check, resolves path
  path = resolve_signed_asset(asset_id, expires, signature)

  if isinstance(path, StoredAsset):
    return Response(
      content=path.data,
      media_type=path.mime_type,
      headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"},
    )
  
  store = _get_store()
  with store._connect() as conn:
    row = conn.execute(
      "SELECT mime_type, availability_status FROM assets WHERE asset_id = ?",
      (asset_id,)
    ).fetchone()
    
  if not row:
    raise HTTPException(status_code=404, detail="Asset not found.")
    
  mime_type, availability_status = row
  
  if availability_status == "missing":
    raise HTTPException(status_code=410, detail="Asset is missing.")
  if availability_status == "invalid":
    raise HTTPException(status_code=410, detail="Asset is invalid.")
    
  if path.name.endswith(".png"):
    if not mime_type or availability_status is None:
      with store._connect() as conn:
        conn.execute(
          "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
          (asset_id,)
        )
      raise HTTPException(status_code=410, detail="Asset is invalid due to incomplete metadata.")
      
  if not mime_type:
    if path.name.endswith(".svg"):
      mime_type = "image/svg+xml"
    else:
      mime_type = "image/png"
      
  return FileResponse(
    path,
    media_type=mime_type,
    headers={
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  )



# ---------------------------------------------------------------------------
# Phase 29 — Async job queue routes
#
# Session isolation: every route extracts session_hash from authorize_photo_gateway.
# SECURITY: No endpoint URL, API key, raw request/response, or binary data is ever
# returned in these responses. assetRef is a signed path only.
# ---------------------------------------------------------------------------

@router.post("/provider-gateway", response_model=PhotoProviderJobEnqueueResponse, status_code=202)
async def enqueue_provider_job(
  gateway_request: PhotoGatewayRequest,
  http_request: Request,
  authorization: str | None = Header(default=None),
  axiom_photo_gateway_session: str | None = Cookie(default=None),
):
  """
  Phase 29: Enqueue a provider job. Returns 202 Accepted with jobId.
  The async worker transitions: queued → processing → completed/failed.

  The lifespan-owned runner schedules provider work after the queued row is committed.
  """
  session_hash = authorize_photo_gateway(
    authorization,
    http_request.client.host if http_request.client else "unknown",
    axiom_photo_gateway_session,
  )
  job_id = enqueue_photo_gateway_job(gateway_request, session_hash)
  runner = getattr(http_request.app.state, "photo_provider_job_runner", None)
  if runner is None:
    _get_store().mark_schedule_failed(job_id)
    raise HTTPException(status_code=503, detail="Photo provider job runner is unavailable.")
  try:
    runner.schedule(job_id=job_id, gateway_request=gateway_request)
  except RuntimeError:
    _get_store().mark_schedule_failed(job_id)
    raise HTTPException(status_code=503, detail="Photo provider job runner is unavailable.")
  return PhotoProviderJobEnqueueResponse(jobId=job_id, status="queued")


@router.get("/provider-jobs/{job_id}", response_model=PhotoProviderJobStatusResponse)
def get_provider_job_status(
  job_id: str,
  request: Request,
  authorization: str | None = Header(default=None),
  axiom_photo_gateway_session: str | None = Cookie(default=None),
):
  """
  Phase 29: Poll job status. Session isolation enforced — 404 if not owned by caller.
  assetRef present only when status == "completed" (signed path, not raw URL/binary).
  """
  session_hash = authorize_photo_gateway(
    authorization,
    request.client.host if request.client else "unknown",
    axiom_photo_gateway_session,
  )
  return poll_photo_gateway_job(job_id, session_hash)


@router.delete("/provider-jobs/{job_id}", status_code=204)
def cancel_provider_job(
  job_id: str,
  request: Request,
  authorization: str | None = Header(default=None),
  axiom_photo_gateway_session: str | None = Cookie(default=None),
):
  """
  Phase 29: Cancel a queued job. Returns 204 on success.
  Returns 409 if job is processing or in a terminal state.
  Returns 404 if job not found or not owned by caller.
  """
  session_hash = authorize_photo_gateway(
    authorization,
    request.client.host if request.client else "unknown",
    axiom_photo_gateway_session,
  )
  cancel_photo_gateway_job(job_id, session_hash)
