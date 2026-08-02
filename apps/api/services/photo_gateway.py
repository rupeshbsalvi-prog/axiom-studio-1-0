"""
Phase 28C + Phase 29 — Photo Gateway Service

Phase 28C: sessions, rate limiting, signed SVG asset delivery.
Phase 29: async provider job queue, job polling, job cancellation, stale-job detection.

SECURITY INVARIANTS (Phase 28C, frozen):
  - SESSION_COOKIE_NAME unchanged.
  - No endpoint URL, API key, raw provider request/response, or signing secret
    is ever returned to callers or stored in provider_jobs rows.
  - provider_jobs stores only: job_id, session_hash (hashed), status, asset_id,
    retry_count, created_at, updated_at, diagnostics (severity/code/message only).

Phase 29 additions:
  - enqueue_photo_gateway_job: creates a provider_jobs row and runs the worker async.
  - poll_photo_gateway_job: returns job status enforcing session isolation.
  - cancel_photo_gateway_job: cancels queued jobs; 409 for processing/terminal.
  - Stale-job detection: jobs stuck in queued/processing beyond AXIOM_JOB_STALE_SECONDS
    are transitioned to failed with a worker_interrupted diagnostic.
"""

import asyncio
import hashlib
import hmac
import json
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlencode

from fastapi import HTTPException

from apps.api.core.config import settings
from apps.api.schemas.photo import (
    PhotoGatewayOutputLayer,
    PhotoGatewayRequest,
    PhotoGatewayResponse,
    PhotoProviderJobStatusResponse,
    PhotoProviderJobDiagnostic,
)
from apps.api.services.supabase_persistence import StoredAsset, SupabasePersistence


SESSION_COOKIE_NAME = "axiom_photo_gateway_session"
_RATE_WINDOW_SECONDS = 60
_store: "PhotoGatewayStore | None" = None
_store_root: str | None = None

_JOB_STATUS_QUEUED = "queued"
_JOB_STATUS_PROCESSING = "processing"
_JOB_STATUS_COMPLETED = "completed"
_JOB_STATUS_FAILED = "failed"
_JOB_STATUS_CANCELLED = "cancelled"
_TERMINAL_STATUSES = {_JOB_STATUS_COMPLETED, _JOB_STATUS_FAILED, _JOB_STATUS_CANCELLED}
_MAX_RETRIES = 2


class PhotoGatewayStore:
    def __init__(self, root: str, persistence: SupabasePersistence | None = None):
        self.root = Path(root).resolve()
        self.persistence = persistence
        self.assets = self.root / "photo-assets"
        self.assets.mkdir(parents=True, exist_ok=True)
        self.database = self.root / "photo-gateway.sqlite3"
        self._migrate()

    def _migrate(self) -> None:
        with self._connect() as connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS schema_migrations (migration_name TEXT PRIMARY KEY, checksum TEXT NOT NULL)"
            )
            migrations = Path(__file__).resolve().parents[1] / "migrations"
            for migration in sorted(migrations.glob("*.sql")):
                sql = migration.read_text(encoding="utf-8")
                checksum = hashlib.sha256(sql.encode()).hexdigest()
                applied = connection.execute(
                    "SELECT checksum FROM schema_migrations WHERE migration_name = ?",
                    (migration.name,),
                ).fetchone()
                if applied:
                    if not hmac.compare_digest(applied[0], checksum):
                        raise RuntimeError(f"Applied migration was modified: {migration.name}")
                    continue
                connection.executescript(sql)
                connection.execute(
                    "INSERT INTO schema_migrations(migration_name, checksum) VALUES (?, ?)",
                    (migration.name, checksum),
                )

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(self.database, timeout=5)
        connection.execute("PRAGMA journal_mode=WAL")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    # ------------------------------------------------------------------
    # Phase 28C — Session management
    # ------------------------------------------------------------------

    def create_session(self) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + settings.AXIOM_PHOTO_GATEWAY_SESSION_TTL_SECONDS
        if self.persistence:
            self.persistence.put_session("photo", _token_hash(token), {}, expires_at)
            return token
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO sessions(token_hash, expires_at) VALUES (?, ?)",
                (_token_hash(token), expires_at),
            )
        return token

    def session_valid(self, token: str) -> bool:
        if self.persistence:
            row = self.persistence.get_session("photo", _token_hash(token))
            if row and row.get("expires_at", 0) > int(time.time()):
                return True
            if row:
                self.revoke_session(token)
            return False
        with self._connect() as connection:
            row = connection.execute(
                "SELECT expires_at FROM sessions WHERE token_hash = ?",
                (_token_hash(token),),
            ).fetchone()
        return bool(row and row[0] > int(time.time()))

    def revoke_session(self, token: str) -> None:
        if self.persistence:
            self.persistence.delete_session("photo", _token_hash(token))
            return
        with self._connect() as connection:
            connection.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))

    def consume_rate_limit(self, client_key: str) -> None:
        now = time.time()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT window_start, request_count FROM rate_windows WHERE client_key = ?",
                (client_key,),
            ).fetchone()
            window_start, count = row if row and now - row[0] < _RATE_WINDOW_SECONDS else (now, 0)
            if count >= settings.AXIOM_PHOTO_GATEWAY_RATE_LIMIT:
                retry_after = max(1, int(_RATE_WINDOW_SECONDS - (now - window_start)))
                raise HTTPException(
                    status_code=429,
                    detail="Photo gateway rate limit exceeded.",
                    headers={"Retry-After": str(retry_after)},
                )
            connection.execute(
                "INSERT OR REPLACE INTO rate_windows(client_key, window_start, request_count) VALUES (?, ?, ?)",
                (client_key, window_start, count + 1),
            )

    def save_svg(
        self, asset_id: str, width: int, height: int, owner_hash: str = "legacy"
    ) -> None:
        file_name = f"{asset_id}.svg"
        target = self.assets / file_name
        temporary = self.assets / f".{file_name}.tmp"
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}"><rect width="100%" height="100%" fill="transparent"/>'
            '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="sans-serif">'
            "Axiom Photo Provider Asset</text></svg>"
        )
        temporary.write_text(svg, encoding="utf-8")
        temporary.replace(target)
        expires_at = int(time.time()) + settings.AXIOM_ASSET_RETENTION_SECONDS
        self.persist_asset(
            asset_id, "svg", target.read_bytes(), "image/svg+xml", owner_hash, expires_at
        )
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO assets(asset_id, file_name, created_at, owner_hash, expires_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (asset_id, file_name, int(time.time()), owner_hash, expires_at),
            )

    def asset_path(self, asset_id: str) -> Path | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT file_name FROM assets WHERE asset_id = ?",
                (asset_id,),
            ).fetchone()
        if not row:
            return None
        path = (self.assets / row[0]).resolve()
        return path if path.parent == self.assets and path.is_file() else None

    def persist_asset(
        self,
        asset_id: str,
        extension: str,
        data: bytes,
        mime_type: str,
        owner_hash: str = "legacy",
        expires_at: int | None = None,
    ) -> None:
        try:
            self.purge_expired_assets()
        except Exception:
            pass
        if self.persistence:
            self.persistence.put_asset(
                asset_id,
                extension,
                data,
                mime_type,
                owner_hash=owner_hash,
                expires_at=expires_at
                or int(time.time()) + settings.AXIOM_ASSET_RETENTION_SECONDS,
            )

    def remote_asset(self, asset_id: str) -> StoredAsset | None:
        return self.persistence.get_asset(asset_id) if self.persistence else None

    def delete_asset(self, asset_id: str, owner_hash: str) -> bool:
        if self.persistence and not self.persistence.delete_asset(asset_id, owner_hash):
            return False
        with self._connect() as connection:
            row = connection.execute(
                "SELECT file_name FROM assets WHERE asset_id = ? AND owner_hash = ?",
                (asset_id, owner_hash),
            ).fetchone()
            if not row and not self.persistence:
                return False
            connection.execute("DELETE FROM assets WHERE asset_id = ?", (asset_id,))
        if row:
            path = (self.assets / row[0]).resolve()
            if path.parent == self.assets and path.is_file():
                path.unlink()
        return True

    def purge_expired_assets(self) -> int:
        now = int(time.time())
        removed = self.persistence.purge_expired_assets(now) if self.persistence else 0
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT asset_id, file_name FROM assets WHERE expires_at IS NOT NULL AND expires_at <= ?",
                (now,),
            ).fetchall()
            connection.execute(
                "DELETE FROM assets WHERE expires_at IS NOT NULL AND expires_at <= ?", (now,)
            )
        for _, file_name in rows:
            path = (self.assets / file_name).resolve()
            if path.parent == self.assets and path.is_file():
                path.unlink()
        return max(removed, len(rows))

    def clear_rate_limits(self) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM rate_windows")

    # ------------------------------------------------------------------
    # Phase 29 — Provider job queue persistence
    # ------------------------------------------------------------------

    def create_job(self, session_hash: str) -> str:
        job_id = uuid.uuid4().hex
        now = int(time.time())
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO provider_jobs(job_id, session_hash, status, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (job_id, session_hash, _JOB_STATUS_QUEUED, now, now),
            )
        return job_id

    def get_job(self, job_id: str, session_hash: str) -> dict | None:
        """Returns the job row if it belongs to session_hash, else None."""
        with self._connect() as connection:
            row = connection.execute(
                "SELECT job_id, status, asset_id, retry_count, created_at, updated_at, diagnostics "
                "FROM provider_jobs WHERE job_id = ? AND session_hash = ?",
                (job_id, session_hash),
            ).fetchone()
        if not row:
            return None
        return {
            "job_id": row[0],
            "status": row[1],
            "asset_id": row[2],
            "retry_count": row[3],
            "created_at": row[4],
            "updated_at": row[5],
            "diagnostics": json.loads(row[6]),
        }

    def update_job_status(
        self,
        job_id: str,
        status: str,
        *,
        asset_id: str | None = None,
        retry_count: int | None = None,
        diagnostics: list | None = None,
    ) -> None:
        now = int(time.time())
        with self._connect() as connection:
            if asset_id is not None and retry_count is not None and diagnostics is not None:
                connection.execute(
                    "UPDATE provider_jobs SET status=?, asset_id=?, retry_count=?, "
                    "diagnostics=?, updated_at=? WHERE job_id=?",
                    (status, asset_id, retry_count, json.dumps(diagnostics), now, job_id),
                )
            elif retry_count is not None and diagnostics is not None:
                connection.execute(
                    "UPDATE provider_jobs SET status=?, retry_count=?, diagnostics=?, "
                    "updated_at=? WHERE job_id=?",
                    (status, retry_count, json.dumps(diagnostics), now, job_id),
                )
            elif diagnostics is not None:
                connection.execute(
                    "UPDATE provider_jobs SET status=?, diagnostics=?, updated_at=? WHERE job_id=?",
                    (status, json.dumps(diagnostics), now, job_id),
                )
            else:
                connection.execute(
                    "UPDATE provider_jobs SET status=?, updated_at=? WHERE job_id=?",
                    (status, now, job_id),
                )

    def cancel_queued_job(self, job_id: str, session_hash: str) -> str | None:
        """
        Cancels a job only if it is in queued state and belongs to session_hash.
        Returns the job status before cancellation, or None if not found.
        """
        with self._connect() as connection:
            row = connection.execute(
                "SELECT status FROM provider_jobs WHERE job_id = ? AND session_hash = ?",
                (job_id, session_hash),
            ).fetchone()
            if not row:
                return None
            current_status = row[0]
            if current_status == _JOB_STATUS_QUEUED:
                now = int(time.time())
                connection.execute(
                    "UPDATE provider_jobs SET status=?, updated_at=? WHERE job_id=?",
                    (_JOB_STATUS_CANCELLED, now, job_id),
                )
            return current_status

    def mark_stale_jobs(self) -> int:
        """
        Marks processing jobs older than AXIOM_JOB_STALE_SECONDS as failed.
        Returns the count of rows transitioned.
        """
        stale_before = int(time.time()) - settings.AXIOM_JOB_STALE_SECONDS
        diag = json.dumps([{
            "severity": "error",
            "code": "worker_interrupted",
            "message": "Job was interrupted and did not complete. Please retry.",
        }])
        with self._connect() as connection:
            cursor = connection.execute(
                "UPDATE provider_jobs SET status=?, diagnostics=?, updated_at=?, worker_id=NULL "
                "WHERE status = ? AND updated_at < ?",
                (_JOB_STATUS_FAILED, diag, int(time.time()),
                 _JOB_STATUS_PROCESSING, stale_before),
            )
            return cursor.rowcount

    def recover_startup_jobs(self) -> tuple[int, int]:
        now = int(time.time())
        queued_diagnostic = json.dumps([{
            "severity": "error",
            "code": "queued_payload_unavailable",
            "message": "Queued provider input was unavailable after restart.",
        }])
        processing_diagnostic = json.dumps([{
            "severity": "error",
            "code": "worker_interrupted",
            "message": "Provider worker was interrupted before completion.",
        }])
        with self._connect() as connection:
            queued = connection.execute(
                "UPDATE provider_jobs SET status='failed', diagnostics=?, updated_at=?, worker_id=NULL "
                "WHERE status='queued'",
                (queued_diagnostic, now),
            ).rowcount
            processing = connection.execute(
                "UPDATE provider_jobs SET status='failed', diagnostics=?, updated_at=?, worker_id=NULL "
                "WHERE status='processing'",
                (processing_diagnostic, now),
            ).rowcount
        return queued, processing

    def mark_schedule_failed(self, job_id: str) -> bool:
        diagnostic = json.dumps([{
            "severity": "error",
            "code": "job_schedule_failed",
            "message": "Provider job could not be scheduled.",
        }])
        with self._connect() as connection:
            cursor = connection.execute(
                "UPDATE provider_jobs SET status='failed', diagnostics=?, updated_at=?, worker_id=NULL "
                "WHERE job_id=? AND status='queued'",
                (diagnostic, int(time.time()), job_id),
            )
        return cursor.rowcount == 1

    def save_asset_for_job(self, asset_id: str, width: int, height: int) -> None:
        """Persists an SVG asset for a provider job (shared with Phase 28C asset table)."""
        self.save_svg(asset_id, width, height)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _get_store() -> PhotoGatewayStore:
    global _store, _store_root
    root = str(Path(settings.AXIOM_RUNTIME_DATA_DIR).resolve())
    store_key = f"{settings.AXIOM_PERSISTENCE_BACKEND}:{root}:{settings.AXIOM_SUPABASE_URL}"
    if _store is None or _store_root != store_key:
        persistence = None
        if settings.AXIOM_PERSISTENCE_BACKEND == "supabase":
            base_url = settings.AXIOM_SUPABASE_URL.rstrip("/")
            secret_key = settings.AXIOM_SUPABASE_SECRET_KEY.get_secret_value()
            if not base_url or not secret_key:
                raise RuntimeError("Supabase persistence is not configured.")
            persistence = SupabasePersistence(base_url, secret_key)
        _store = PhotoGatewayStore(root, persistence)
        _store_root = store_key
    return _store


def reset_photo_gateway_state_for_test() -> None:
    global _store, _store_root
    _store = None
    _store_root = None


def reset_photo_gateway_rate_limits_for_test() -> None:
    _get_store().clear_rate_limits()


# ---------------------------------------------------------------------------
# Phase 28C — Session and gateway (preserved unchanged)
# ---------------------------------------------------------------------------

def create_photo_gateway_session(authorization: str | None) -> str:
    configured_token = settings.AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN
    scheme, _, token = (authorization or "").partition(" ")
    if not configured_token:
        raise HTTPException(status_code=503, detail="Photo gateway is not configured.")
    if scheme.lower() != "bearer" or not token or not hmac.compare_digest(token, configured_token):
        raise HTTPException(status_code=401, detail="Invalid gateway credentials.", headers={"WWW-Authenticate": "Bearer"})
    return _get_store().create_session()


def revoke_photo_gateway_session(session_token: str | None) -> None:
    if session_token:
        _get_store().revoke_session(session_token)


def authorize_photo_gateway(
    authorization: str | None,
    client_host: str,
    session_token: str | None = None,
) -> str:
    """Validates auth and returns the session_hash for job isolation."""
    configured_token = settings.AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN
    scheme, _, bearer = (authorization or "").partition(" ")
    bearer_valid = bool(
        configured_token
        and scheme.lower() == "bearer"
        and bearer
        and hmac.compare_digest(bearer, configured_token)
    )
    session_valid = bool(session_token and _get_store().session_valid(session_token))
    if not bearer_valid and not session_valid:
        raise HTTPException(status_code=401, detail="Invalid gateway credentials.", headers={"WWW-Authenticate": "Bearer"})

    identity = _token_hash(session_token if session_valid else bearer)
    rate_key = _token_hash(f"{client_host}:{identity}")
    _get_store().consume_rate_limit(rate_key)
    # Return session_hash for use in job isolation (hashed, never raw token)
    return identity


def execute_photo_gateway(request: PhotoGatewayRequest) -> PhotoGatewayResponse:
    """
    Phase 28C synchronous path retained for backward compatibility with existing tests.
    Phase 29 routes use the async enqueue path instead.
    """
    if not settings.AXIOM_PHOTO_PROVIDER_API_KEY or not settings.AXIOM_ASSET_SIGNING_SECRET:
        raise HTTPException(status_code=503, detail="Photo gateway is not configured.")

    asset_id = uuid.uuid4().hex
    store = _get_store()
    store.save_svg(asset_id, request.canvasHint.width, request.canvasHint.height)
    expires = int(time.time()) + 300
    path = f"/api/photo/assets/{asset_id}"
    signature = _asset_signature(path, expires)
    source = f"{path}?{urlencode({'expires': expires, 'signature': signature})}"

    return PhotoGatewayResponse(
        contractVersion="photo-provider-live-response.v1",
        routeId="photo.generate.dev",
        status="success",
        outputLayers=[PhotoGatewayOutputLayer(
            index=0,
            label="generated-photo",
            type="image",
            source=source,
            width=request.canvasHint.width,
            height=request.canvasHint.height,
            opacity=1,
            blendMode="normal",
        )],
        diagnostics=[],
    )


def resolve_signed_asset(asset_id: str, expires: int, signature: str) -> Path | StoredAsset:
    path = f"/api/photo/assets/{asset_id}"
    if expires <= int(time.time()) or not hmac.compare_digest(signature, _asset_signature(path, expires)):
        raise HTTPException(status_code=403, detail="Asset reference is invalid or expired.")
    store = _get_store()
    asset = store.remote_asset(asset_id) if store.persistence else store.asset_path(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


def _asset_signature(path: str, expires: int) -> str:
    return hmac.new(
        settings.AXIOM_ASSET_SIGNING_SECRET.encode(),
        f"{path}:{expires}".encode(),
        hashlib.sha256,
    ).hexdigest()


# ---------------------------------------------------------------------------
# Phase 29 — Async job queue
# ---------------------------------------------------------------------------

def enqueue_photo_gateway_job(request: PhotoGatewayRequest, session_hash: str) -> str:
    """
    Creates a provider_jobs row in 'queued' state and returns the job_id.

    NOTE: This function persists only. The lifespan-owned runner schedules the worker.

    SECURITY: session_hash is already hashed by authorize_photo_gateway.
    No prompt text, endpoint, API key, or raw provider data stored in the row.
    """
    if not settings.AXIOM_ASSET_SIGNING_SECRET or (
        settings.AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER
        and not settings.AXIOM_PHOTO_PROVIDER_API_KEY
    ):
        raise HTTPException(status_code=503, detail="Photo gateway is not configured.")

    store = _get_store()
    job_id = store.create_job(session_hash)
    return job_id


async def _heartbeat_loop(store, job_id: str, worker_id: str, ownership_lost_event: asyncio.Event) -> None:
    while not ownership_lost_event.is_set():
        try:
            await asyncio.sleep(30)
        except asyncio.CancelledError:
            break
            
        if ownership_lost_event.is_set():
            break
            
        # SQLite lock retries: 3 attempts with 1s, 2s, 4s delay
        lock_retries = 3
        success = False
        for attempt in range(lock_retries + 1):
            try:
                with store._connect() as conn:
                    cursor = conn.execute(
                        "UPDATE provider_jobs SET updated_at = ? "
                        "WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                        (int(time.time()), job_id, worker_id)
                    )
                    if cursor.rowcount == 1:
                        success = True
                        break
                    else:
                        ownership_lost_event.set()
                        break
            except sqlite3.OperationalError:
                if attempt < lock_retries:
                    try:
                        await asyncio.sleep(2 ** attempt)
                    except asyncio.CancelledError:
                        break
                else:
                    break
            except Exception:
                ownership_lost_event.set()
                break
                
        if not success and not ownership_lost_event.is_set():
            ownership_lost_event.set()


async def _run_job_worker(job_id: str, request: PhotoGatewayRequest) -> None:
    """
    Async worker: transitions queued → processing → completed/failed.
    Retries up to _MAX_RETRIES times on timeout.
    """
    import os
    import logging
    from apps.api.services.photo_provider_adapter import get_provider_adapter
    
    logger = logging.getLogger("axiom.photo_gateway.worker")
    store = _get_store()
    
    # 1. Atomic claim
    worker_id = uuid.uuid4().hex
    now = int(time.time())
    with store._connect() as conn:
        cursor = conn.execute(
            "UPDATE provider_jobs SET status = 'processing', worker_id = ?, updated_at = ? "
            "WHERE job_id = ? AND status = 'queued' AND worker_id IS NULL",
            (worker_id, now, job_id)
        )
        claim_ok = (cursor.rowcount == 1)
        owner = conn.execute(
            "SELECT session_hash FROM provider_jobs WHERE job_id = ? AND worker_id = ?",
            (job_id, worker_id),
        ).fetchone()
        session_hash = owner[0] if owner else ""
        
    if not claim_ok or not session_hash:
        # worker_claim_conflict
        return
        
    # Get adapter
    try:
        adapter = get_provider_adapter()
    except Exception as e:
        diag = [{"severity": "error", "code": "configuration_error", "message": "Mutual exclusivity configuration error."}]
        with store._connect() as conn:
            conn.execute(
                "UPDATE provider_jobs SET status = 'failed', diagnostics = ?, updated_at = ?, worker_id = NULL "
                "WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                (json.dumps(diag), int(time.time()), job_id, worker_id)
            )
        return

    # Check key if using OpenAI
    from apps.api.core.config import settings
    if settings.AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER:
        if not settings.AXIOM_PHOTO_PROVIDER_API_KEY:
            diag = [{"severity": "error", "code": "configuration_missing", "message": "API Key missing."}]
            with store._connect() as conn:
                conn.execute(
                    "UPDATE provider_jobs SET status = 'failed', diagnostics = ?, updated_at = ?, worker_id = NULL "
                    "WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                    (json.dumps(diag), int(time.time()), job_id, worker_id)
                )
            return

    # Set execution flags on the adapter
    if hasattr(adapter, "providerExecuted"):
        adapter.providerExecuted = True

    # Heartbeat task
    ownership_lost_event = asyncio.Event()
    heartbeat_task = asyncio.create_task(_heartbeat_loop(store, job_id, worker_id, ownership_lost_event))
    
    retry_count = 0
    last_diagnostics: list = []
    provider_dispatch_started = False
    generation_task: asyncio.Task | None = None
    
    try:
        while retry_count <= _MAX_RETRIES:
            if ownership_lost_event.is_set():
                break
                
            if retry_count > 0:
                # Calculate retry delay
                delay = min(2 ** retry_count, 30)
                if last_diagnostics and last_diagnostics[0].get("code") == "provider_rate_limited":
                    retry_after = last_diagnostics[0].get("retry_after")
                    if retry_after:
                        try:
                            parsed_delay = int(retry_after)
                            if parsed_delay >= 0:
                                delay = min(parsed_delay, 60)
                        except ValueError:
                            pass
                
                try:
                    await asyncio.sleep(delay)
                except asyncio.CancelledError:
                    raise
                
            if ownership_lost_event.is_set():
                break

            # Cancellation checkpoint before provider dispatch becomes ambiguous.
            await asyncio.sleep(0)

            # Set networkAccessed and providerApiCalled just before adapter call
            if hasattr(adapter, "networkAccessed"):
                adapter.networkAccessed = True
            if hasattr(adapter, "providerApiCalled"):
                adapter.providerApiCalled = True

            provider_dispatch_started = True
            generation_task = asyncio.create_task(
                adapter.generate(
                    request,
                    assets_dir=store.assets,
                    signing_secret=settings.AXIOM_ASSET_SIGNING_SECRET,
                )
            )

            # Wait for generation or ownership loss
            while not generation_task.done() and not ownership_lost_event.is_set():
                await asyncio.sleep(0.5)

            if ownership_lost_event.is_set():
                generation_task.cancel()
                try:
                    await generation_task
                except asyncio.CancelledError:
                    pass
                break

            try:
                result = await generation_task
            except Exception:
                result = None
                last_diagnostics = [{
                    "severity": "error",
                    "code": "worker_exception",
                    "message": "Provider call raised an unexpected error.",
                }]

            if result is None:
                retry_count += 1
                continue

            if result.success:
                asset_id = uuid.uuid4().hex
                expires = int(time.time()) + 300
                path = f"/api/photo/assets/{asset_id}"
                signature = _asset_signature(path, expires)
                signed_ref = f"{path}?{urlencode({'expires': expires, 'signature': signature})}"
                
                if result.validated_bytes is not None:
                    temp_file = store.assets / f".temp_{asset_id}.bin"
                    final_file = store.assets / f"{asset_id}.png"
                    
                    try:
                        temp_file.write_bytes(result.validated_bytes)
                        sha256_hash = hashlib.sha256(result.validated_bytes).hexdigest()
                        byte_size = len(result.validated_bytes)
                        expires_at = int(time.time()) + settings.AXIOM_ASSET_RETENTION_SECONDS
                        store.persist_asset(
                            asset_id,
                            "png",
                            result.validated_bytes,
                            "image/png",
                            session_hash,
                            expires_at,
                        )
                    except Exception:
                        if temp_file.exists():
                            try:
                                temp_file.unlink()
                            except Exception:
                                pass
                        last_diagnostics = [{"severity": "error", "code": "temp_file_failure", "message": "Failed to write temp asset file."}]
                        break
                    
                    try:
                        with store._connect() as conn:
                            chk = conn.execute(
                                "SELECT 1 FROM provider_jobs WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                                (job_id, worker_id)
                            ).fetchone()
                            if not chk:
                                raise RuntimeError("worker_ownership_lost")
                            
                            conn.execute(
                                "INSERT INTO assets(asset_id, file_name, created_at, mime_type, byte_size, width, height, sha256, availability_status, owner_hash, expires_at) "
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                (asset_id, f"{asset_id}.png", int(time.time()), "image/png", byte_size, result.width, result.height, sha256_hash, "available", session_hash, expires_at)
                            )
                            
                            os.replace(str(temp_file), str(final_file))
                            
                            cursor = conn.execute(
                                "UPDATE provider_jobs SET status = 'completed', asset_id = ?, updated_at = ?, worker_id = NULL "
                                "WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                                (signed_ref, int(time.time()), job_id, worker_id)
                            )
                            if cursor.rowcount != 1:
                                raise RuntimeError("worker_completion_row_count_failure")
                                
                        ownership_lost_event.set()
                        return
                    except Exception:
                        if temp_file.exists():
                            try:
                                temp_file.unlink()
                            except Exception:
                                pass
                        if final_file.exists():
                            try:
                                final_file.unlink()
                            except Exception:
                                pass
                            try:
                                with store._connect() as conn:
                                    conn.execute("UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?", (asset_id,))
                            except Exception:
                                pass
                                
                        last_diagnostics = [{"severity": "error", "code": "asset_persistence_failure", "message": "Asset persistence failed."}]
                        break
                else:
                    try:
                        with store._connect() as conn:
                            chk = conn.execute(
                                "SELECT 1 FROM provider_jobs WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                                (job_id, worker_id)
                            ).fetchone()
                            if not chk:
                                raise RuntimeError("worker_ownership_lost")
                                
                            svg_path = store.assets / f"{result.asset_id}.svg"
                            b_size = svg_path.stat().st_size if svg_path.exists() else 0
                            b_bytes = svg_path.read_bytes() if svg_path.exists() else b""
                            sha = hashlib.sha256(b_bytes).hexdigest() if b_bytes else ""
                            expires_at = int(time.time()) + settings.AXIOM_ASSET_RETENTION_SECONDS
                            store.persist_asset(
                                result.asset_id,
                                "svg",
                                b_bytes,
                                "image/svg+xml",
                                session_hash,
                                expires_at,
                            )
                            
                            conn.execute(
                                "INSERT INTO assets(asset_id, file_name, created_at, mime_type, byte_size, width, height, sha256, availability_status, owner_hash, expires_at) "
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                (result.asset_id, f"{result.asset_id}.svg", int(time.time()), "image/svg+xml", b_size, result.width, result.height, sha, "available", session_hash, expires_at)
                            )
                            
                            expires = int(time.time()) + 300
                            path = f"/api/photo/assets/{result.asset_id}"
                            signature = _asset_signature(path, expires)
                            mock_signed_ref = f"{path}?{urlencode({'expires': expires, 'signature': signature})}"
                            
                            cursor = conn.execute(
                                "UPDATE provider_jobs SET status = 'completed', asset_id = ?, updated_at = ?, worker_id = NULL "
                                "WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                                (mock_signed_ref, int(time.time()), job_id, worker_id)
                            )
                            if cursor.rowcount != 1:
                                raise RuntimeError("worker_completion_row_count_failure")
                                
                        ownership_lost_event.set()
                        return
                    except Exception:
                        last_diagnostics = [{"severity": "error", "code": "asset_persistence_failure", "message": "Asset persistence failed."}]
                        break

            last_diagnostics = result.diagnostics
            is_retryable = any(
                d.get("code") in ("provider_connect_failed", "provider_dispatch_failed", "provider_rate_limited", "provider_server_error")
                for d in last_diagnostics
            )
            
            if not is_retryable or retry_count >= _MAX_RETRIES:
                break
                
            retry_count += 1

        if not ownership_lost_event.is_set():
            diag_code = last_diagnostics[0].get("code", "unknown") if last_diagnostics else "unknown"
            if retry_count > _MAX_RETRIES:
                diag_code = "retry_exhaustion"
                last_diagnostics = [{"severity": "error", "code": "retry_exhaustion", "message": "Maximum retries exhausted."}]
                
            with store._connect() as conn:
                conn.execute(
                    "UPDATE provider_jobs SET status = 'failed', retry_count = ?, diagnostics = ?, updated_at = ?, worker_id = NULL "
                    "WHERE job_id = ? AND status = 'processing' AND worker_id = ?",
                    (retry_count, json.dumps(last_diagnostics), int(time.time()), job_id, worker_id)
                )

    except asyncio.CancelledError:
        if generation_task and not generation_task.done():
            generation_task.cancel()
            await asyncio.gather(generation_task, return_exceptions=True)
        diagnostic = [{
            "severity": "error",
            "code": "ambiguous_provider_timeout" if provider_dispatch_started else "worker_interrupted",
            "message": (
                "Provider dispatch outcome is ambiguous after worker cancellation."
                if provider_dispatch_started
                else "Provider worker was interrupted before dispatch."
            ),
        }]
        with store._connect() as conn:
            conn.execute(
                "UPDATE provider_jobs SET status='failed', diagnostics=?, updated_at=?, worker_id=NULL "
                "WHERE job_id=? AND status='processing' AND worker_id=?",
                (json.dumps(diagnostic), int(time.time()), job_id, worker_id),
            )
        raise
    finally:
        ownership_lost_event.set()
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass


def poll_photo_gateway_job(job_id: str, session_hash: str) -> PhotoProviderJobStatusResponse:
    """
    Returns current job status for the given job_id, enforcing session isolation.
    Raises 404 if not found or not owned by session_hash.

    Also performs opportunistic stale-job detection.
    """
    store = _get_store()
    # Sweep stale jobs before polling (best-effort; never fails the request)
    try:
        store.mark_stale_jobs()
    except Exception:
        pass

    row = store.get_job(job_id, session_hash)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found.")

    asset_ref: str | None = None
    if row["status"] == _JOB_STATUS_COMPLETED and row.get("asset_id"):
        asset_ref = row["asset_id"]  # already a signed path, not a raw URL

    return PhotoProviderJobStatusResponse(
        jobId=row["job_id"],
        status=row["status"],
        assetRef=asset_ref,
        retryCount=row["retry_count"],
        diagnostics=[
            PhotoProviderJobDiagnostic(
                severity=d.get("severity", "error"),
                code=d.get("code", "unknown"),
                message=d.get("message", ""),
            )
            for d in row["diagnostics"]
        ],
        createdAt=_epoch_to_iso(row["created_at"]),
        updatedAt=_epoch_to_iso(row["updated_at"]),
    )


def cancel_photo_gateway_job(job_id: str, session_hash: str) -> None:
    """
    Cancels a queued job. Raises 404 if not found/not owned.
    Raises 409 if job is processing or in a terminal state.

    Phase 29 rule: only queued jobs can be cancelled.
    """
    store = _get_store()
    prior_status = store.cancel_queued_job(job_id, session_hash)

    if prior_status is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    if prior_status != _JOB_STATUS_QUEUED:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel job in '{prior_status}' state. "
                   "Only queued jobs can be cancelled in Phase 29.",
        )


def _epoch_to_iso(epoch: int) -> str:
    import datetime
    return datetime.datetime.fromtimestamp(epoch, datetime.UTC).isoformat()
