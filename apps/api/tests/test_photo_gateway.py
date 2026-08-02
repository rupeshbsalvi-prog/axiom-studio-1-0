from fastapi.testclient import TestClient
from pathlib import Path
import shutil
import pytest
import time

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services.photo_gateway import reset_photo_gateway_rate_limits_for_test


client = TestClient(app)


def wait_for_job(job_id: str, headers: dict[str, str]):
    deadline = time.time() + 5
    while time.time() < deadline:
        response = client.get(f"/api/photo/provider-jobs/{job_id}", headers=headers)
        if response.json().get("status") in ("completed", "failed"):
            return response
        time.sleep(0.05)
    return response


@pytest.fixture(autouse=True)
def isolated_gateway_runtime(monkeypatch):
    global client
    runtime = Path("apps/api/tests/.runtime-test/legacy")
    shutil.rmtree(runtime, ignore_errors=True)
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    reset_photo_gateway_rate_limits_for_test()
    with TestClient(app) as running_client:
        client = running_client
        yield
    from apps.api.services.photo_gateway import reset_photo_gateway_state_for_test
    reset_photo_gateway_state_for_test()
    shutil.rmtree(runtime, ignore_errors=True)


def request_body():
    return {
        "contractVersion": "photo-provider-live-request.v1",
        "routeId": "photo.generate.dev",
        "promptText": "Create a transparent product hero image",
        "canvasHint": {
            "width": 1024,
            "height": 1024,
            "aspectRatio": "1:1",
            "transparentBackground": True,
        },
        "layers": [],
        "security": {
            "dryRunPreview": False,
            "noRealProviderCalled": False,
            "providerId": "mock-photo-provider",
            "secretsIncluded": False,
            "endpointUrlIncluded": False,
        },
    }


def configure_gateway(monkeypatch, rate_limit=100):
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_ACCESS_TOKEN", "gateway-access-token")
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "provider-secret")
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "asset-signing-secret")
    monkeypatch.setattr(settings, "AXIOM_PHOTO_GATEWAY_RATE_LIMIT", rate_limit)
    reset_photo_gateway_rate_limits_for_test()


def test_gateway_rejects_missing_or_invalid_bearer_token(monkeypatch):
    configure_gateway(monkeypatch)

    assert client.post("/api/photo/provider-gateway", json=request_body()).status_code == 401
    response = client.post(
        "/api/photo/provider-gateway",
        headers={"Authorization": "Bearer wrong-token"},
        json=request_body(),
    )
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_openai_gateway_fails_closed_when_provider_key_is_missing(monkeypatch):
    configure_gateway(monkeypatch)
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", True)
    monkeypatch.setattr(settings, "AXIOM_ENABLE_STUB_REAL_PROVIDER", False)
    monkeypatch.setattr(settings, "AXIOM_PHOTO_PROVIDER_API_KEY", "")

    # Now returns 503 at enqueue time because of fail-closed configuration gate
    response = client.post(
        "/api/photo/provider-gateway",
        headers={"Authorization": "Bearer gateway-access-token"},
        json=request_body(),
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Photo gateway is not configured."


def test_gateway_returns_only_signed_relative_asset_references(monkeypatch):
    configure_gateway(monkeypatch)

    response = client.post(
        "/api/photo/provider-gateway",
        headers={"Authorization": "Bearer gateway-access-token"},
        json=request_body(),
    )

    assert response.status_code == 202
    job_id = response.json()["jobId"]

    # Poll status to verify signed asset path
    poll_resp = wait_for_job(job_id, {"Authorization": "Bearer gateway-access-token"})
    assert poll_resp.status_code == 200
    data = poll_resp.json()
    assert data["status"] == "completed"
    source = data["assetRef"]
    assert source.startswith("/api/photo/assets/")
    assert "expires=" in source and "signature=" in source
    serialized = poll_resp.text
    assert "provider-secret" not in serialized
    assert "asset-signing-secret" not in serialized
    assert "http://" not in serialized and "https://" not in serialized


def test_gateway_rate_limits_each_authenticated_client(monkeypatch):
    configure_gateway(monkeypatch, rate_limit=1)
    headers = {"Authorization": "Bearer gateway-access-token"}

    assert client.post("/api/photo/provider-gateway", headers=headers, json=request_body()).status_code == 202
    response = client.post("/api/photo/provider-gateway", headers=headers, json=request_body())

    assert response.status_code == 429
    assert response.headers["retry-after"]


def test_gateway_rejects_unbounded_or_extra_input(monkeypatch):
    configure_gateway(monkeypatch)
    body = request_body()
    body["promptText"] = "x" * 501
    body["providerCredential"] = "must-not-cross-boundary"

    response = client.post(
        "/api/photo/provider-gateway",
        headers={"Authorization": "Bearer gateway-access-token"},
        json=body,
    )

    assert response.status_code == 422
