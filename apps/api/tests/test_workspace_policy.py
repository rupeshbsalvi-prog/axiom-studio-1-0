import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services import auth_session


@pytest.fixture
def policy_client(monkeypatch):
    runtime_root = Path("apps/api/tests/.runtime-test") / f"policy-{uuid.uuid4().hex}"
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime_root))
    monkeypatch.setattr(settings, "AXIOM_WORKSPACE_ID", "workspace-local")
    monkeypatch.setattr(settings, "AXIOM_WORKSPACE_LEARNING_ALLOWED", False)
    monkeypatch.setattr(settings, "AXIOM_WORKSPACE_POLICY_REQUIRED", True)
    monkeypatch.setattr(auth_session, "_store", None)
    monkeypatch.setattr(auth_session, "_store_root", None)
    with TestClient(app, base_url="https://testserver") as client:
        yield client
    auth_session._store = None
    auth_session._store_root = None


def authenticate(
    client: TestClient,
    *,
    workspace_id: str = "workspace-local",
    role: str = "admin",
) -> str:
    token = auth_session.get_auth_store().create_session(
        "user-1",
        "person@example.com",
        [
            auth_session.AuthWorkspaceMembership(
                workspaceId=workspace_id,
                memberId="user-1",
                role=role,
            )
        ],
    )
    client.cookies.set(auth_session.AUTH_SESSION_COOKIE_NAME, token, path="/api")
    return token


def test_reads_policy_for_explicit_session_workspace(policy_client):
    authenticate(policy_client)

    response = policy_client.get("/api/workspaces/workspace-local/learning-policy")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "contractVersion": "axiom-workspace-learning-authority.v1",
        "membership": {
            "workspaceId": "workspace-local",
            "memberId": "user-1",
            "role": "admin",
            "status": "active",
        },
        "policy": {
            "policyId": "workspace-local:learning",
            "policyVersion": 1,
            "workspaceId": "workspace-local",
            "learningAllowed": False,
            "allowedScopes": ["local_workspace"],
            "policyRequired": True,
            "source": "server_configuration",
        },
    }


def test_rejects_missing_invalid_and_expired_sessions(policy_client, monkeypatch):
    missing = policy_client.get("/api/workspaces/workspace-local/learning-policy")

    policy_client.cookies.set(
        auth_session.AUTH_SESSION_COOKIE_NAME, "invalid-session", path="/api"
    )
    invalid = policy_client.get("/api/workspaces/workspace-local/learning-policy")

    now = 1_800_000_000
    monkeypatch.setattr(auth_session.time, "time", lambda: now)
    authenticate(policy_client)
    monkeypatch.setattr(auth_session.time, "time", lambda: now + 901)
    expired = policy_client.get("/api/workspaces/workspace-local/learning-policy")

    for response in (missing, invalid, expired):
        assert response.status_code == 401
        assert response.headers["cache-control"] == "no-store"
        assert response.json() == {"detail": "Invalid or expired authentication session."}


def test_rejects_cross_workspace_session_without_inference(policy_client):
    authenticate(policy_client, workspace_id="workspace-other")

    response = policy_client.get("/api/workspaces/workspace-local/learning-policy")

    assert response.status_code == 404
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {"detail": "Workspace not found."}


def test_fails_closed_when_policy_source_is_unavailable(policy_client, monkeypatch):
    authenticate(policy_client)
    monkeypatch.setattr(settings, "AXIOM_WORKSPACE_ID", "")

    response = policy_client.get("/api/workspaces/workspace-local/learning-policy")

    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {"detail": "Workspace policy source is not configured."}


def test_legacy_bearer_cannot_authorize_policy_read(policy_client):
    response = policy_client.get(
        "/api/workspaces/workspace-local/learning-policy",
        headers={"Authorization": "Bearer legacy-policy-token"},
    )

    assert response.status_code == 401
    assert "legacy-policy-token" not in response.text


def test_policy_route_has_no_mutation_contract(policy_client):
    authenticate(policy_client)

    response = policy_client.post(
        "/api/workspaces/workspace-local/learning-policy",
        json={"learningAllowed": True},
    )

    assert response.status_code == 405
