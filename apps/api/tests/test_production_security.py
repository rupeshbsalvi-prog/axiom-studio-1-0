import json
import os
import subprocess
import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.routes import auth, health
from apps.api.services import auth_session


@pytest.fixture
def security_client(monkeypatch):
    runtime = Path("apps/api/tests/.runtime-test") / f"security-{uuid.uuid4().hex}"
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    monkeypatch.setattr(settings, "AXIOM_WORKSPACE_ID", "workspace-local")
    monkeypatch.setattr(settings, "AXIOM_SECURE_COOKIES", True)
    monkeypatch.setattr(auth_session, "_store", None)
    monkeypatch.setattr(auth_session, "_store_root", None)
    with TestClient(app, base_url="https://testserver", raise_server_exceptions=False) as client:
        yield client
    auth_session._store = None
    auth_session._store_root = None


def authenticate(client: TestClient) -> None:
    token = auth_session.get_auth_store().create_session(
        "user-1",
        "person@example.com",
        [
            auth_session.AuthWorkspaceMembership(
                workspaceId="workspace-local",
                memberId="user-1",
                role="member",
            )
        ],
    )
    client.cookies.set(auth_session.AUTH_SESSION_COOKIE_NAME, token, path="/api")


def test_planner_requires_active_configured_workspace(security_client):
    denied = security_client.post("/api/brain/plan", json={"intent": "Create a poster"})
    authenticate(security_client)
    allowed = security_client.post("/api/brain/plan", json={"intent": "Create a poster"})

    assert denied.status_code == 401
    assert allowed.status_code == 200


@pytest.mark.parametrize("path", ["/api/brain/plan", "/api/photo/plan", "/api/vector/plan"])
def test_planner_intent_is_bounded(security_client, path):
    authenticate(security_client)

    response = security_client.post(path, json={"intent": "x" * 4001})

    assert response.status_code == 422


def test_unexpected_errors_are_sanitized_and_correlated(security_client, monkeypatch):
    authenticate(security_client)

    def explode(*args, **kwargs):
        raise ZeroDivisionError("integer modulo by zero")

    monkeypatch.setattr("apps.api.routes.brain.brain_planner_service.generate_plan", explode)
    response = security_client.post("/api/brain/plan", json={"intent": "Create a poster"})

    assert response.status_code == 500
    assert "modulo" not in response.text
    assert response.json() == {
        "error": {
            "code": "internal_error",
            "message": "Internal server error.",
            "requestId": response.headers["x-request-id"],
        }
    }


def test_security_headers_and_request_id_are_added(security_client):
    response = security_client.get("/api/health")

    assert response.headers["strict-transport-security"].startswith("max-age=")
    assert response.headers["content-security-policy"].startswith("default-src 'self'")
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["permissions-policy"]
    assert uuid.UUID(response.headers["x-request-id"])


def test_production_disables_public_api_docs():
    environment = os.environ.copy()
    environment["AXIOM_ENVIRONMENT"] = "production"
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "from apps.api.main import app; print(app.docs_url, app.redoc_url, app.openapi_url)",
        ],
        cwd=Path(__file__).resolve().parents[3],
        env=environment,
        capture_output=True,
        text=True,
        check=True,
    )

    assert result.stdout.strip() == "None None None"


def test_login_is_rate_limited_per_client(security_client, monkeypatch):
    monkeypatch.setattr(settings, "AXIOM_SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(settings, "AXIOM_AUTH_LOGIN_RATE_LIMIT", 2)
    auth.reset_login_rate_limits_for_test()

    responses = [
        security_client.get("/api/auth/login", follow_redirects=False)
        for _ in range(3)
    ]

    assert [response.status_code for response in responses] == [307, 307, 429]
    assert responses[-1].headers["retry-after"]


def test_readiness_checks_persistence_without_exposing_failure(security_client, monkeypatch):
    monkeypatch.setattr(health, "check_persistence_ready", lambda: True)
    ready = security_client.get("/api/ready")

    monkeypatch.setattr(
        health,
        "check_persistence_ready",
        lambda: (_ for _ in ()).throw(RuntimeError("server-secret")),
    )
    unavailable = security_client.get("/api/ready")

    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"
    assert unavailable.status_code == 503
    assert "server-secret" not in unavailable.text


def test_request_log_is_structured_and_contains_request_id(security_client, caplog):
    with caplog.at_level("INFO", logger="axiom.request"):
        response = security_client.get("/api/health")

    event = json.loads(next(record.message for record in caplog.records if record.name == "axiom.request"))
    assert event["request_id"] == response.headers["x-request-id"]
    assert event["method"] == "GET"
    assert event["path"] == "/api/health"
    assert event["status"] == 200
    assert "query" not in event
