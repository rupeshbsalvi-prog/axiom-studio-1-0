from contextlib import asynccontextmanager
import json
import logging
from pathlib import Path
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from apps.api.core.config import settings
from apps.api.routes import auth, health, brain, providers, photo, vector, workspace_policy

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run startup maintenance
    from apps.api.services.photo_gateway import _get_store
    from apps.api.services.photo_asset_maintenance import run_legacy_backfill, run_reconciliation
    from apps.api.services.photo_provider_job_runner import PhotoProviderJobRunner
    import logging
    
    logger = logging.getLogger("axiom.main.lifespan")
    
    # 1. Schema migration
    try:
        store = _get_store()
    except Exception as e:
        logger.error("FATAL: Database migration failed on startup: %s", str(e))
        raise RuntimeError("Database migration failed") from e

    # 2. Idempotent legacy backfill
    try:
        run_legacy_backfill(store)
    except Exception as e:
        if settings.AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER:
            logger.error("FATAL: Legacy SVG backfill failed on startup in OpenAI mode: %s", str(e))
            raise RuntimeError("Legacy SVG backfill failed") from e
        else:
            logger.warning("Warning: Legacy SVG backfill failed on startup in mock/stub mode: %s", str(e))

    # 3. Crash reconciliation
    try:
        run_reconciliation(store)
    except Exception as e:
        if settings.AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER:
            logger.error("FATAL: Crash reconciliation failed on startup in OpenAI mode: %s", str(e))
            raise RuntimeError("Crash reconciliation failed") from e
        else:
            logger.warning("Warning: Crash reconciliation failed on startup in mock/stub mode: %s", str(e))

    try:
        store.purge_expired_assets()
    except Exception:
        logger.warning("Asset retention cleanup was unavailable at startup.")

    runner = PhotoProviderJobRunner(store=store)
    try:
        await runner.start()
        app.state.photo_provider_job_runner = runner
        yield
    finally:
        await runner.stop()
        if hasattr(app.state, "photo_provider_job_runner"):
            del app.state.photo_provider_job_runner

app = FastAPI(
    title="Axiom Studio API",
    description="Backend services, Axiom Brain, and provider connector baselines.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.AXIOM_ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.AXIOM_ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if settings.AXIOM_ENVIRONMENT == "production" else "/openapi.json",
)


@app.middleware("http")
async def security_and_observability(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as error:
        logging.getLogger("axiom.error").error(
            json.dumps(
                {
                    "event": "request_error",
                    "request_id": request_id,
                    "exception_type": type(error).__name__,
                }
            )
        )
        response = JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "internal_error",
                    "message": "Internal server error.",
                    "requestId": request_id,
                }
            },
        )
    response.headers["X-Request-ID"] = request_id
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; "
        "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; "
        "worker-src 'self' blob:"
    )
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.AXIOM_ENVIRONMENT == "production" or settings.AXIOM_SECURE_COOKIES:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    logging.getLogger("axiom.request").info(
        json.dumps(
            {
                "event": "request_complete",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            }
        )
    )
    return response


# Wire CORS middleware safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.AXIOM_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.AXIOM_ALLOWED_METHODS,
    allow_headers=settings.AXIOM_ALLOWED_HEADERS,
)

# Register routes under /api
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(brain.router, prefix="/api", tags=["Brain"])
app.include_router(providers.router, prefix="/api", tags=["Providers"])
app.include_router(photo.router)
app.include_router(vector.router)
app.include_router(workspace_policy.router)
app.include_router(auth.router)

frontend = Path(__file__).resolve().parents[2] / "dist"
if (frontend / "index.html").is_file():
    app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
