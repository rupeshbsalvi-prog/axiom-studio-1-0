import asyncio
import shutil
import uuid
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pytest
import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services import auth_session


@pytest.fixture
def auth_client(monkeypatch):
    runtime_root = Path("apps/api/tests/.runtime-test") / f"auth-{uuid.uuid4().hex}"
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime_root))
    monkeypatch.setattr(settings, "AXIOM_SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(
        settings, "AXIOM_SUPABASE_PUBLISHABLE_KEY", SecretStr("test-publishable-key")
    )
    monkeypatch.setattr(settings, "AXIOM_AUTH_OAUTH_PROVIDER", "google")
    monkeypatch.setattr(
        settings,
        "AXIOM_AUTH_CALLBACK_URL",
        "http://localhost:8000/api/auth/callback",
    )
    monkeypatch.setattr(
        settings, "AXIOM_AUTH_POST_LOGIN_REDIRECT", "http://localhost:5173/"
    )
    monkeypatch.setattr(settings, "AXIOM_AUTH_FLOW_TTL_SECONDS", 300)
    monkeypatch.setattr(settings, "AXIOM_AUTH_SESSION_TTL_SECONDS", 900)
    monkeypatch.setattr(settings, "AXIOM_SECURE_COOKIES", True)
    monkeypatch.setattr(auth_session, "_store", None)
    monkeypatch.setattr(auth_session, "_store_root", None)
    with TestClient(app, base_url="https://testserver") as client:
        yield client
    auth_session._store = None
    auth_session._store_root = None
    shutil.rmtree(runtime_root, ignore_errors=True)


def start_login(client: TestClient) -> tuple[str, str]:
    response = client.get("/api/auth/login", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["cache-control"] == "no-store"
    location = response.headers["location"]
    query = parse_qs(urlparse(location).query)
    redirect_to = urlparse(query["redirect_to"][0])
    state = parse_qs(redirect_to.query)["state"][0]
    return location, state


def install_provider_success(monkeypatch) -> None:
    async def exchange(code: str, verifier: str):
        assert code == "single-use-code"
        assert len(verifier) >= 43
        return auth_session.SupabaseIdentity(
            user_id="user-1",
            email="person@example.com",
            access_token="provider-access-token",
        )

    async def memberships(access_token: str, user_id: str):
        assert access_token == "provider-access-token"
        assert user_id == "user-1"
        return [
            auth_session.AuthWorkspaceMembership(
                workspaceId="workspace-local",
                memberId="user-1",
                role="admin",
            )
        ]

    monkeypatch.setattr(auth_session, "exchange_supabase_code", exchange)
    monkeypatch.setattr(auth_session, "fetch_workspace_memberships", memberships)


def complete_login(client: TestClient, monkeypatch):
    _, state = start_login(client)
    install_provider_success(monkeypatch)
    return client.get(
        "/api/auth/callback",
        params={"code": "single-use-code", "state": state},
        follow_redirects=False,
    )


def test_login_start_creates_bound_pkce_redirect(auth_client):
    location, state = start_login(auth_client)

    parsed = urlparse(location)
    query = parse_qs(parsed.query)
    cookie = auth_client.cookies.get("axiom_auth_flow")

    assert parsed.geturl().startswith("https://project.supabase.co/auth/v1/authorize?")
    assert query["provider"] == ["google"]
    assert query["code_challenge_method"] == ["s256"]
    assert len(query["code_challenge"][0]) == 43
    assert len(state) >= 32
    assert cookie and cookie not in location and state not in cookie


def test_callback_issues_only_opaque_httponly_application_session(
    auth_client, monkeypatch
):
    response = complete_login(auth_client, monkeypatch)

    set_cookie = response.headers["set-cookie"]
    assert response.status_code == 303
    assert response.headers["location"] == "http://localhost:5173/"
    assert "axiom_auth_session=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert "provider-access-token" not in set_cookie
    assert "test-publishable-key" not in set_cookie

    session = auth_client.get("/api/auth/session")
    assert session.status_code == 200
    assert session.headers["cache-control"] == "no-store"
    assert session.json() == {
        "contractVersion": "axiom-auth-session.v1",
        "status": "authenticated",
        "user": {"id": "user-1", "email": "person@example.com"},
        "memberships": [
            {
                "workspaceId": "workspace-local",
                "memberId": "user-1",
                "role": "admin",
                "status": "active",
            }
        ],
    }
    assert "token" not in session.text.lower()
    database = auth_session.get_auth_store().database.read_bytes()
    assert b"provider-access-token" not in database
    assert b"test-publishable-key" not in database
    assert auth_client.cookies["axiom_auth_session"].encode() not in database


def test_callback_requires_same_browser_state_and_is_single_use(auth_client, monkeypatch):
    _, state = start_login(auth_client)
    install_provider_success(monkeypatch)

    wrong_state = auth_client.get(
        "/api/auth/callback",
        params={"code": "single-use-code", "state": "wrong-state"},
        follow_redirects=False,
    )
    replay = auth_client.get(
        "/api/auth/callback",
        params={"code": "single-use-code", "state": state},
        follow_redirects=False,
    )

    assert wrong_state.status_code == 401
    assert replay.status_code == 401
    assert auth_client.get("/api/auth/session").status_code == 401


def test_callback_rejects_browser_without_flow_cookie(auth_client, monkeypatch):
    _, state = start_login(auth_client)
    install_provider_success(monkeypatch)

    with TestClient(app, base_url="https://testserver") as other_browser:
        response = other_browser.get(
            "/api/auth/callback",
            params={"code": "single-use-code", "state": state},
            follow_redirects=False,
        )

    assert response.status_code == 401


def test_callback_fails_closed_without_active_workspace_membership(
    auth_client, monkeypatch
):
    _, state = start_login(auth_client)

    async def exchange(code: str, verifier: str):
        return auth_session.SupabaseIdentity(
            user_id="user-1", email=None, access_token="provider-access-token"
        )

    async def no_memberships(access_token: str, user_id: str):
        return []

    monkeypatch.setattr(auth_session, "exchange_supabase_code", exchange)
    monkeypatch.setattr(auth_session, "fetch_workspace_memberships", no_memberships)

    response = auth_client.get(
        "/api/auth/callback",
        params={"code": "single-use-code", "state": state},
        follow_redirects=False,
    )

    assert response.status_code == 403
    assert auth_client.get("/api/auth/session").status_code == 401


def test_provider_failure_is_sanitized_and_does_not_create_session(
    auth_client, monkeypatch
):
    _, state = start_login(auth_client)

    async def fail_exchange(code: str, verifier: str):
        raise auth_session.AuthProviderError("provider response contained a secret")

    monkeypatch.setattr(auth_session, "exchange_supabase_code", fail_exchange)
    response = auth_client.get(
        "/api/auth/callback",
        params={"code": "single-use-code", "state": state},
        follow_redirects=False,
    )

    assert response.status_code == 502
    assert response.json() == {"detail": "Identity provider request failed."}
    assert "secret" not in response.text
    assert auth_client.get("/api/auth/session").status_code == 401


def test_logout_revokes_session_and_clears_cookie(auth_client, monkeypatch):
    complete_login(auth_client, monkeypatch)

    logout = auth_client.delete("/api/auth/session")

    assert logout.status_code == 204
    assert "axiom_auth_session=" in logout.headers["set-cookie"]
    assert "Max-Age=0" in logout.headers["set-cookie"]
    assert auth_client.get("/api/auth/session").status_code == 401


def test_expired_application_session_fails_closed(auth_client, monkeypatch):
    now = 1_800_000_000
    monkeypatch.setattr(auth_session.time, "time", lambda: now)
    complete_login(auth_client, monkeypatch)
    monkeypatch.setattr(auth_session.time, "time", lambda: now + 901)

    response = auth_client.get("/api/auth/session")

    assert response.status_code == 401


def test_auth_endpoints_fail_closed_when_supabase_is_unconfigured(
    auth_client, monkeypatch
):
    monkeypatch.setattr(settings, "AXIOM_SUPABASE_URL", "")
    monkeypatch.setattr(settings, "AXIOM_SUPABASE_PUBLISHABLE_KEY", SecretStr(""))

    response = auth_client.get("/api/auth/login", follow_redirects=False)

    assert response.status_code == 503
    assert response.json() == {"detail": "Authentication provider is not configured."}


def test_login_rejects_unsafe_post_login_redirect(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "AXIOM_AUTH_POST_LOGIN_REDIRECT", "javascript:alert(1)")

    response = auth_client.get("/api/auth/login", follow_redirects=False)

    assert response.status_code == 503


def test_login_flow_store_is_bounded(auth_client, monkeypatch):
    monkeypatch.setattr(auth_session, "MAX_PENDING_AUTH_FLOWS", 1)

    first = auth_client.get("/api/auth/login", follow_redirects=False)
    second = auth_client.get("/api/auth/login", follow_redirects=False)

    assert first.status_code == 307
    assert second.status_code == 429


def test_supabase_adapter_exchanges_code_and_reads_only_active_user_memberships(
    auth_client, monkeypatch
):
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path == "/auth/v1/token":
            return httpx.Response(
                200,
                json={
                    "access_token": "provider-access-token",
                    "user": {"id": "user-1", "email": "person@example.com"},
                },
            )
        return httpx.Response(
            200,
            json=[
                {
                    "workspace_id": "workspace-local",
                    "user_id": "user-1",
                    "role": "member",
                    "status": "active",
                },
                {
                    "workspace_id": "workspace-inactive",
                    "user_id": "user-1",
                    "role": "member",
                    "status": "inactive",
                },
                {
                    "workspace_id": "workspace-other-user",
                    "user_id": "user-2",
                    "role": "owner",
                    "status": "active",
                },
            ],
        )

    real_async_client = httpx.AsyncClient
    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        auth_session.httpx,
        "AsyncClient",
        lambda **kwargs: real_async_client(transport=transport),
    )

    identity = asyncio.run(auth_session.exchange_supabase_code("auth-code", "verifier"))
    memberships = asyncio.run(
        auth_session.fetch_workspace_memberships(identity.access_token, identity.user_id)
    )

    assert identity.user_id == "user-1"
    assert [membership.workspaceId for membership in memberships] == ["workspace-local"]
    assert requests[0].url.query == b"grant_type=pkce"
    assert requests[0].headers["apikey"] == "test-publishable-key"
    assert requests[1].headers["authorization"] == "Bearer provider-access-token"


def test_supabase_adapter_rejects_malformed_membership_response(
    auth_client, monkeypatch
):
    real_async_client = httpx.AsyncClient
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=[None]))
    monkeypatch.setattr(
        auth_session.httpx,
        "AsyncClient",
        lambda **kwargs: real_async_client(transport=transport),
    )

    with pytest.raises(auth_session.AuthProviderError):
        asyncio.run(auth_session.fetch_workspace_memberships("access-token", "user-1"))
