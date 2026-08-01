import asyncio
import inspect
import shutil
import socket
import threading
import time
from pathlib import Path

import httpx
import pytest
import uvicorn

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services.photo_gateway import reset_photo_gateway_state_for_test
from apps.api.services.photo_provider_adapter import MockProviderAdapter
from apps.api.tests.test_photo_provider_jobs import job_request_body


class DelayedProvider:
    def __init__(self, delay: float):
        self.delay = delay
        self.call_count = 0
        self.delegate = MockProviderAdapter()

    def is_configured(self):
        return True

    async def generate(self, request, assets_dir, signing_secret):
        self.call_count += 1
        await asyncio.sleep(self.delay)
        return await self.delegate.generate(request, assets_dir, signing_secret)


def free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def start_server(port: int):
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.time() + 10
    while not server.started and thread.is_alive() and time.time() < deadline:
        time.sleep(0.02)
    assert server.started
    return server, thread


@pytest.fixture
def real_server_settings(monkeypatch):
    runtime = Path("apps/api/tests/.runtime-test/runner-integration")
    shutil.rmtree(runtime, ignore_errors=True)
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN", "gateway-access-token")
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "asset-signing-secret")
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_RATE_LIMIT", 100)
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    monkeypatch.setattr(settings, "AXIOM_ENABLE_STUB_REAL_PROVIDER", False)
    reset_photo_gateway_state_for_test()
    yield runtime
    reset_photo_gateway_state_for_test()
    shutil.rmtree(runtime, ignore_errors=True)


def test_real_uvicorn_returns_202_before_provider_completion_and_runs_once(monkeypatch, real_server_settings):
    provider = DelayedProvider(0.8)
    monkeypatch.setattr("apps.api.services.photo_provider_adapter.get_provider_adapter", lambda: provider)
    port = free_port()
    server, thread = start_server(port)
    base = f"http://127.0.0.1:{port}"
    headers = {"Authorization": "Bearer gateway-access-token"}

    try:
        with httpx.Client(base_url=base, timeout=5) as client:
            started = time.perf_counter()
            response = client.post("/api/photo/provider-gateway", headers=headers, json=job_request_body())
            latency = time.perf_counter() - started
            assert response.status_code == 202
            assert response.json()["status"] == "queued"
            assert latency < 0.5
            job_id = response.json()["jobId"]

            first = client.get(f"/api/photo/provider-jobs/{job_id}", headers=headers)
            assert first.json()["status"] in ("queued", "processing")
            assert client.get("/api/health").status_code == 200

            deadline = time.time() + 5
            status = first.json()["status"]
            while status != "completed" and time.time() < deadline:
                time.sleep(0.1)
                status = client.get(f"/api/photo/provider-jobs/{job_id}", headers=headers).json()["status"]
            assert status == "completed"
            assert provider.call_count == 1
    finally:
        server.should_exit = True
        thread.join(timeout=10)

    assert not thread.is_alive()
    assert not hasattr(app.state, "photo_provider_job_runner")
    from apps.api.routes import photo
    assert "BackgroundTasks" not in inspect.getsource(photo.enqueue_provider_job)
