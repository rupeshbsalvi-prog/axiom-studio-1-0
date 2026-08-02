from pathlib import Path

import httpx
from pydantic import SecretStr

from apps.api.core.config import settings
from apps.api.services import auth_session, photo_gateway
from apps.api.services.supabase_persistence import SupabasePersistence


def test_server_sessions_and_assets_use_supabase_rest_and_private_storage() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        path = request.url.path
        if path.endswith("/rpc/axiom_consume_auth_flow"):
            return httpx.Response(200, json="verifier")
        if path.endswith("/axiom_sessions") and request.method == "GET":
            return httpx.Response(200, json=[{"payload": {"user_id": "user-1"}, "expires_at": 2_000_000_000}])
        if path.endswith("/object/authenticated/axiom-photo-assets/asset-1.png") and request.method == "GET":
            return httpx.Response(200, content=b"png", headers={"content-type": "image/png"})
        return httpx.Response(204)

    persistence = SupabasePersistence(
        "https://project.supabase.co",
        "server-secret",
        transport=httpx.MockTransport(handler),
    )

    persistence.put_session("auth", "token-hash", {"user_id": "user-1"}, 2_000_000_000)
    assert persistence.get_session("auth", "token-hash") == {
        "payload": {"user_id": "user-1"},
        "expires_at": 2_000_000_000,
    }
    persistence.delete_session("auth", "token-hash")
    assert persistence.consume_auth_flow("flow-hash", "state-hash") == "verifier"
    assert persistence.check_ready() is True
    persistence.put_asset("asset-1", "png", b"png", "image/png")
    asset = persistence.get_asset("asset-1")
    assert asset and asset.data == b"png" and asset.mime_type == "image/png"

    assert all(request.headers["apikey"] == "server-secret" for request in requests)
    assert all("authorization" not in request.headers for request in requests)
    assert requests[0].url.path == "/rest/v1/axiom_sessions"
    readiness_paths = {
        request.url.path for request in requests
        if request.method == "GET" and request.url.params.get("limit") == "0"
    }
    assert readiness_paths == {
        "/rest/v1/axiom_sessions",
        "/rest/v1/axiom_assets",
    }
    assert requests[-1].url.path == "/storage/v1/object/authenticated/axiom-photo-assets/asset-1.png"


def test_asset_read_tries_svg_after_supabase_reports_missing_png() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith(".png"):
            return httpx.Response(400, json={"statusCode": "404", "code": "NoSuchKey"})
        return httpx.Response(200, content=b"<svg/>")

    persistence = SupabasePersistence(
        "https://project.supabase.co",
        "server-secret",
        transport=httpx.MockTransport(handler),
    )

    asset = persistence.get_asset("asset-1")

    assert asset and asset.data == b"<svg/>" and asset.extension == "svg"


def test_asset_retention_metadata_and_authorized_delete_use_service_only_rest() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith("/axiom_assets") and request.method == "GET":
            owner = request.url.params.get("owner_hash")
            return httpx.Response(
                200,
                json=[{"extension": "png"}] if owner == "eq.owner-1" else [],
            )
        return httpx.Response(204)

    persistence = SupabasePersistence(
        "https://project.supabase.co",
        "server-secret",
        transport=httpx.MockTransport(handler),
    )

    persistence.put_asset(
        "asset-1", "png", b"png", "image/png", owner_hash="owner-1", expires_at=2_000_000_000
    )
    assert persistence.delete_asset("asset-1", "wrong-owner") is False
    assert persistence.delete_asset("asset-1", "owner-1") is True

    metadata_write = next(
        request for request in requests
        if request.url.path.endswith("/axiom_assets") and request.method == "POST"
    )
    assert b"owner-1" in metadata_write.content
    assert any(
        request.url.path.endswith("/object/axiom-photo-assets") and request.method == "DELETE"
        for request in requests
    )


def test_asset_retention_migration_is_service_only_and_expiry_indexed() -> None:
    migration = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "postgres"
        / "0003_asset_retention.up.sql"
    ).read_text(encoding="utf-8").lower()

    assert "create table public.axiom_assets" in migration
    assert "owner_hash" in migration
    assert "expires_at" in migration
    assert "enable row level security" in migration
    assert "from anon, authenticated" in migration
    assert "to service_role" in migration


def test_supabase_migration_locks_runtime_state_to_service_role() -> None:
    migration = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "postgres"
        / "0002_runtime_persistence.up.sql"
    ).read_text(encoding="utf-8").lower()
    rollback = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "postgres"
        / "0002_runtime_persistence.down.sql"
    ).read_text(encoding="utf-8").lower()

    assert "create table public.axiom_sessions" in migration
    assert "create table public.axiom_auth_flows" in migration
    assert "enable row level security" in migration
    assert "revoke all" in migration
    assert "from anon, authenticated" in migration
    assert "to service_role" in migration
    assert "axiom-photo-assets" in migration
    assert "drop table if exists public.axiom_sessions" in rollback


def test_supabase_backend_is_selected_for_auth_and_photo_runtime(monkeypatch) -> None:
    runtime = Path("apps/api/tests/.runtime-test/supabase-selection")
    monkeypatch.setattr(settings, "AXIOM_PERSISTENCE_BACKEND", "supabase")
    monkeypatch.setattr(settings, "AXIOM_SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(settings, "AXIOM_SUPABASE_SECRET_KEY", SecretStr("server-secret"))
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    monkeypatch.setattr(auth_session, "_store", None)
    monkeypatch.setattr(auth_session, "_store_root", None)
    photo_gateway.reset_photo_gateway_state_for_test()

    assert auth_session.get_auth_store().__class__.__name__ == "SupabaseAuthSessionStore"
    assert photo_gateway._get_store().persistence is not None
