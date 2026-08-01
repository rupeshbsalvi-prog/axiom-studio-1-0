from pathlib import Path
import shutil
import sqlite3
import uuid
import time

import pytest
from fastapi.testclient import TestClient

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services.photo_gateway import reset_photo_gateway_state_for_test
from apps.api.tests.test_photo_gateway import request_body


def configure(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN", "bootstrap-token")
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "signing-secret")
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(tmp_path / "runtime"))
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_RATE_LIMIT", 100)
    reset_photo_gateway_state_for_test()


def wait_for_job(client: TestClient, job_id: str):
    deadline = time.time() + 5
    while time.time() < deadline:
        response = client.get(f"/api/photo/provider-jobs/{job_id}")
        if response.json().get("status") in ("completed", "failed"):
            return response
        time.sleep(0.05)
    return response


@pytest.fixture
def runtime_dir():
    path = Path("apps/api/tests/.runtime-test") / uuid.uuid4().hex
    yield path
    reset_photo_gateway_state_for_test()
    shutil.rmtree(path, ignore_errors=True)


@pytest.fixture(autouse=True)
def running_application(monkeypatch):
    runtime = Path("apps/api/tests/.runtime-test/session-lifespan")
    shutil.rmtree(runtime, ignore_errors=True)
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    reset_photo_gateway_state_for_test()
    with TestClient(app) as running_client:
        yield running_client
    reset_photo_gateway_state_for_test()
    shutil.rmtree(runtime, ignore_errors=True)


def test_bearer_exchange_creates_opaque_httponly_session(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    client = running_application

    response = client.post(
        "/api/photo/provider-session",
        headers={"Authorization": "Bearer bootstrap-token"},
    )

    assert response.status_code == 204
    cookie = response.headers["set-cookie"]
    assert "axiom_photo_gateway_session=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=strict" in cookie
    assert "bootstrap-token" not in cookie


def test_session_cookie_authorizes_gateway_and_asset_delivery(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    client = running_application
    client.post("/api/photo/provider-session", headers={"Authorization": "Bearer bootstrap-token"})

    # POST enqueues job and returns 202
    gateway = client.post("/api/photo/provider-gateway", json=request_body())
    assert gateway.status_code == 202
    job_id = gateway.json()["jobId"]

    # Poll status to retrieve assetRef
    poll = wait_for_job(client, job_id)
    assert poll.status_code == 200
    assert poll.json()["status"] == "completed", poll.json()
    source = poll.json()["assetRef"]

    # Get asset
    asset = client.get(source)
    assert asset.status_code == 200
    assert asset.headers["content-type"].startswith("image/svg+xml")
    assert asset.content.startswith(b"<svg")


def test_signed_asset_survives_service_reinitialization(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    client = running_application
    client.post("/api/photo/provider-session", headers={"Authorization": "Bearer bootstrap-token"})

    gateway = client.post("/api/photo/provider-gateway", json=request_body())
    assert gateway.status_code == 202
    job_id = gateway.json()["jobId"]

    poll = wait_for_job(client, job_id)
    assert poll.json()["status"] == "completed", poll.json()
    source = poll.json()["assetRef"]

    reset_photo_gateway_state_for_test()

    assert TestClient(app).get(source).status_code == 200


def test_tampered_or_expired_asset_reference_is_denied(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    client = running_application
    client.post("/api/photo/provider-session", headers={"Authorization": "Bearer bootstrap-token"})

    gateway = client.post("/api/photo/provider-gateway", json=request_body())
    assert gateway.status_code == 202
    job_id = gateway.json()["jobId"]

    poll = wait_for_job(client, job_id)
    assert poll.json()["status"] == "completed", poll.json()
    source = poll.json()["assetRef"]

    assert client.get(source.replace("signature=", "signature=0")).status_code == 403
    path = source.split("?", 1)[0]
    assert client.get(f"{path}?expires=1&signature={'0' * 64}").status_code == 403


def test_logout_revokes_the_gateway_session(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    client = running_application
    client.post("/api/photo/provider-session", headers={"Authorization": "Bearer bootstrap-token"})

    assert client.delete("/api/photo/provider-session").status_code == 204
    assert client.post("/api/photo/provider-gateway", json=request_body()).status_code == 401


def test_rate_limit_state_is_shared_after_service_reinitialization(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_RATE_LIMIT", 1)
    headers = {"Authorization": "Bearer bootstrap-token"}

    assert running_application.post("/api/photo/provider-gateway", headers=headers, json=request_body()).status_code == 202
    reset_photo_gateway_state_for_test()

    response = running_application.post("/api/photo/provider-gateway", headers=headers, json=request_body())
    assert response.status_code == 429


def test_gateway_schema_is_installed_by_an_immutable_migration(monkeypatch, runtime_dir, running_application):
    configure(monkeypatch, runtime_dir)
    client = running_application
    client.post("/api/photo/provider-session", headers={"Authorization": "Bearer bootstrap-token"})
    database = runtime_dir / "runtime" / "photo-gateway.sqlite3"

    with sqlite3.connect(database) as connection:
        migrations = connection.execute("SELECT migration_name FROM schema_migrations").fetchall()

    # In Phase 30, 0001, 0002, and 0003 migrations are run
    assert set(migrations) == {
        ("0001_photo_gateway.sql",),
        ("0002_photo_provider_jobs.sql",),
        ("0003_photo_asset_metadata.sql",),
    }
