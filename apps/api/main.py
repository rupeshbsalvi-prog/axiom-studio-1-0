from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    lifespan=lifespan
)


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
