import asyncio
import gc
import logging
import weakref
import json
import shutil
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from apps.api.schemas.photo import PhotoGatewayRequest
from apps.api.core.config import settings
from apps.api.services.photo_gateway import PhotoGatewayStore
from apps.api.services.photo_gateway import _run_job_worker
from apps.api.main import app
from fastapi.testclient import TestClient
from apps.api.tests.test_photo_provider_jobs import job_request_body
from apps.api.services.photo_provider_job_runner import PhotoProviderJobRunner


def gateway_request() -> PhotoGatewayRequest:
    return PhotoGatewayRequest.model_validate({
        "contractVersion": "photo-provider-live-request.v1",
        "routeId": "photo.generate.dev",
        "promptText": "transient private prompt",
        "canvasHint": {"width": 512, "height": 512, "aspectRatio": "1:1", "transparentBackground": True},
        "layers": [],
        "security": {
            "dryRunPreview": False,
            "noRealProviderCalled": False,
            "providerId": "mock-photo-provider",
            "secretsIncluded": False,
            "endpointUrlIncluded": False,
        },
    })


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_scheduling_creates_one_task_and_duplicate_is_ignored():
    release = asyncio.Event()
    calls = 0

    async def worker(job_id, request):
        nonlocal calls
        calls += 1
        await release.wait()

    runner = PhotoProviderJobRunner(store=MagicMock(), worker=worker)
    await runner.start()
    request = gateway_request()
    runner.schedule(job_id="job-1", gateway_request=request)
    runner.schedule(job_id="job-1", gateway_request=request)
    await asyncio.sleep(0)

    assert len(runner._tasks) == 1
    assert calls == 1
    release.set()
    await runner.stop()


@pytest.mark.anyio
async def test_schedule_returns_without_awaiting_and_completion_removes_registry_entry():
    release = asyncio.Event()

    async def worker(job_id, request):
        await release.wait()

    runner = PhotoProviderJobRunner(store=MagicMock(), worker=worker)
    await runner.start()
    runner.schedule(job_id="job-1", gateway_request=gateway_request())
    assert "job-1" in runner._tasks
    release.set()
    await asyncio.sleep(0)
    await asyncio.sleep(0)
    assert "job-1" not in runner._tasks
    await runner.stop()


@pytest.mark.anyio
async def test_done_callback_consumes_and_redacts_worker_exception(caplog):
    async def worker(job_id, request):
        raise RuntimeError("RAW_SECRET_PROMPT")

    caplog.set_level(logging.ERROR)
    runner = PhotoProviderJobRunner(store=MagicMock(), worker=worker)
    await runner.start()
    runner.schedule(job_id="job-1", gateway_request=gateway_request())
    await asyncio.sleep(0)
    await asyncio.sleep(0)

    assert "job-1" not in runner._tasks
    assert "RAW_SECRET_PROMPT" not in caplog.text
    assert "runner_task_failed" in caplog.text
    await runner.stop()


@pytest.mark.anyio
async def test_request_reference_is_released_after_completion():
    async def worker(job_id, request):
        return None

    runner = PhotoProviderJobRunner(store=MagicMock(), worker=worker)
    await runner.start()
    request = gateway_request()
    reference = weakref.ref(request)
    runner.schedule(job_id="job-1", gateway_request=request)
    del request
    await asyncio.sleep(0)
    await asyncio.sleep(0)
    gc.collect()
    assert reference() is None
    await runner.stop()


@pytest.mark.anyio
async def test_stopping_rejects_schedule_and_marks_queued_job_failed():
    store = MagicMock()
    runner = PhotoProviderJobRunner(store=store, worker=MagicMock())
    await runner.start()
    await runner.stop()

    with pytest.raises(RuntimeError):
        runner.schedule(job_id="job-1", gateway_request=gateway_request())

    store.mark_schedule_failed.assert_called_once_with("job-1")


@pytest.mark.anyio
async def test_task_creation_failure_releases_coroutine_and_marks_schedule_failed(monkeypatch):
    store = MagicMock()
    runner = PhotoProviderJobRunner(store=store, worker=MagicMock())
    await runner.start()
    monkeypatch.setattr(asyncio, "create_task", MagicMock(side_effect=RuntimeError("raw scheduler failure")))

    with pytest.raises(RuntimeError, match="could not be scheduled"):
        runner.schedule(job_id="job-1", gateway_request=gateway_request())

    store.mark_schedule_failed.assert_called_once_with("job-1")
    assert runner._tasks == {}
    await runner.stop()


@pytest.mark.anyio
async def test_shutdown_cancels_awaits_and_leaves_no_detached_tasks():
    cancelled = asyncio.Event()

    async def worker(job_id, request):
        try:
            await asyncio.Event().wait()
        finally:
            cancelled.set()

    runner = PhotoProviderJobRunner(store=MagicMock(), worker=worker)
    await runner.start()
    runner.schedule(job_id="job-1", gateway_request=gateway_request())
    await asyncio.sleep(0)
    task = runner._tasks["job-1"]
    await runner.stop()

    assert cancelled.is_set()
    assert task.done()
    assert runner._tasks == {}


@pytest.mark.anyio
async def test_startup_recovery_runs_before_accepting_schedules_and_never_replays_provider():
    store = MagicMock()
    worker = MagicMock()
    runner = PhotoProviderJobRunner(store=store, worker=worker)

    await runner.start()

    store.recover_startup_jobs.assert_called_once()
    worker.assert_not_called()
    assert runner._stopping is False


@pytest.fixture
def real_store(monkeypatch):
    runtime = Path("apps/api/tests/.runtime-test/runner")
    shutil.rmtree(runtime, ignore_errors=True)
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    store = PhotoGatewayStore(str(runtime))
    yield store
    shutil.rmtree(runtime, ignore_errors=True)


@pytest.mark.anyio
async def test_scheduling_failure_transitions_only_the_queued_row(real_store):
    job_id = real_store.create_job("session")
    runner = PhotoProviderJobRunner(store=real_store)

    with pytest.raises(RuntimeError):
        runner.schedule(job_id=job_id, gateway_request=gateway_request())

    with real_store._connect() as connection:
        row = connection.execute(
            "SELECT status, diagnostics, worker_id, asset_id FROM provider_jobs WHERE job_id=?",
            (job_id,),
        ).fetchone()
    assert row[0] == "failed"
    assert json.loads(row[1])[0]["code"] == "job_schedule_failed"
    assert row[2:] == (None, None)


def test_route_scheduling_failure_does_not_leave_a_queued_row(monkeypatch, real_store):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN", "gateway-access-token")
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "signing-secret")
    app.state.photo_provider_job_runner = PhotoProviderJobRunner(store=real_store)
    try:
        response = TestClient(app).post(
            "/api/photo/provider-gateway",
            headers={"Authorization": "Bearer gateway-access-token"},
            json=job_request_body(),
        )
    finally:
        del app.state.photo_provider_job_runner

    assert response.status_code == 503
    with real_store._connect() as connection:
        row = connection.execute(
            "SELECT status, diagnostics, worker_id, asset_id FROM provider_jobs ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
    assert row[0] == "failed"
    assert json.loads(row[1])[0]["code"] == "job_schedule_failed"
    assert row[2:] == (None, None)


@pytest.mark.anyio
async def test_startup_recovery_separates_queued_and_processing_without_replay(real_store):
    queued_id = real_store.create_job("session")
    processing_id = real_store.create_job("session")
    with real_store._connect() as connection:
        connection.execute(
            "UPDATE provider_jobs SET status='processing', worker_id='old-worker' WHERE job_id=?",
            (processing_id,),
        )
    worker = MagicMock()
    runner = PhotoProviderJobRunner(store=real_store, worker=worker)

    await runner.start()

    with real_store._connect() as connection:
        rows = connection.execute(
            "SELECT job_id, status, diagnostics, worker_id, asset_id FROM provider_jobs ORDER BY job_id"
        ).fetchall()
    by_id = {row[0]: row for row in rows}
    assert json.loads(by_id[queued_id][2])[0]["code"] == "queued_payload_unavailable"
    assert json.loads(by_id[processing_id][2])[0]["code"] == "worker_interrupted"
    assert by_id[queued_id][1] == "failed"
    assert by_id[queued_id][3:] == (None, None)
    assert by_id[processing_id][3:] == (None, None)
    worker.assert_not_called()
    await runner.stop()


@pytest.mark.anyio
async def test_immediate_runner_stop_persists_worker_interrupted(monkeypatch, real_store):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "signing-secret")
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    runner = PhotoProviderJobRunner(store=real_store)
    await runner.start()
    job_id = real_store.create_job("session")

    runner.schedule(job_id=job_id, gateway_request=gateway_request())
    await runner.stop()

    with real_store._connect() as connection:
        row = connection.execute(
            "SELECT status, diagnostics, worker_id FROM provider_jobs WHERE job_id=?",
            (job_id,),
        ).fetchone()
    assert row[0] == "failed"
    assert json.loads(row[1])[0]["code"] == "worker_interrupted"
    assert row[2] is None


@pytest.mark.anyio
async def test_worker_cancellation_before_dispatch_is_worker_interrupted(monkeypatch, real_store):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "signing-secret")
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    job_id = real_store.create_job("session")
    task = asyncio.create_task(_run_job_worker(job_id, gateway_request()))
    await asyncio.sleep(0)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task

    with real_store._connect() as connection:
        row = connection.execute(
            "SELECT status, diagnostics, worker_id FROM provider_jobs WHERE job_id=?",
            (job_id,),
        ).fetchone()
    assert row[0] == "failed"
    assert json.loads(row[1])[0]["code"] == "worker_interrupted"
    assert row[2] is None


@pytest.mark.anyio
async def test_worker_cancellation_after_dispatch_is_ambiguous_and_ownership_checked(monkeypatch, real_store):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "signing-secret")
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    dispatched = asyncio.Event()
    provider_cancelled = asyncio.Event()

    class BlockingAdapter:
        async def generate(self, request, assets_dir, signing_secret):
            dispatched.set()
            try:
                await asyncio.Event().wait()
            finally:
                provider_cancelled.set()

    monkeypatch.setattr("apps.api.services.photo_provider_adapter.get_provider_adapter", lambda: BlockingAdapter())
    job_id = real_store.create_job("session")
    task = asyncio.create_task(_run_job_worker(job_id, gateway_request()))
    await dispatched.wait()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task

    with real_store._connect() as connection:
        row = connection.execute(
            "SELECT status, diagnostics, worker_id FROM provider_jobs WHERE job_id=?",
            (job_id,),
        ).fetchone()
    assert row[0] == "failed"
    assert json.loads(row[1])[0]["code"] == "ambiguous_provider_timeout"
    assert row[2] is None
    assert provider_cancelled.is_set()


@pytest.mark.anyio
async def test_cancelled_worker_that_lost_ownership_makes_no_transition(monkeypatch, real_store):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "signing-secret")
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    dispatched = asyncio.Event()

    class BlockingAdapter:
        async def generate(self, request, assets_dir, signing_secret):
            dispatched.set()
            await asyncio.Event().wait()

    monkeypatch.setattr("apps.api.services.photo_provider_adapter.get_provider_adapter", lambda: BlockingAdapter())
    job_id = real_store.create_job("session")
    task = asyncio.create_task(_run_job_worker(job_id, gateway_request()))
    await dispatched.wait()
    with real_store._connect() as connection:
        connection.execute(
            "UPDATE provider_jobs SET worker_id='replacement-worker' WHERE job_id=?",
            (job_id,),
        )
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task

    with real_store._connect() as connection:
        row = connection.execute(
            "SELECT status, diagnostics, worker_id FROM provider_jobs WHERE job_id=?",
            (job_id,),
        ).fetchone()
    assert row == ("processing", "[]", "replacement-worker")
