import shutil
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services import auth_session
from apps.api.tests.conftest import authenticate_workspace_client
from apps.api.services.photo_gateway import (
    reset_photo_gateway_state_for_test,
    reset_photo_gateway_rate_limits_for_test,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_photo_runtime(monkeypatch):
    runtime = Path("apps/api/tests/.runtime-test/photo_routes")
    shutil.rmtree(runtime, ignore_errors=True)
    monkeypatch.setattr(settings, "AXIOM_RUNTIME_DATA_DIR", str(runtime))
    monkeypatch.setattr(settings, "AXIOM_ASSET_SIGNING_SECRET", "asset-signing-secret")
    reset_photo_gateway_state_for_test()
    reset_photo_gateway_rate_limits_for_test()
    auth_session._store = None
    auth_session._store_root = None
    authenticate_workspace_client(client)
    yield
    client.cookies.clear()
    auth_session._store = None
    auth_session._store_root = None
    reset_photo_gateway_state_for_test()
    shutil.rmtree(runtime, ignore_errors=True)


def test_get_photo_templates():
  response = client.get("/api/photo/templates")
  assert response.status_code == 200
  data = response.json()
  assert "categories" in data
  assert "lighting" in data
  assert "aspectRatios" in data
  assert "aesthetics" in data
  assert "portrait" in data["categories"]

def test_plan_photo_composition():
  response = client.post(
    "/api/photo/plan",
    json={
      "intent": "Generate Luxury Perfume Poster",
      "category": "product",
      "aspectRatio": "1:1",
      "style": "luxury"
    }
  )
  assert response.status_code == 200
  data = response.json()
  assert data["intent"] == "Generate Luxury Perfume Poster"
  assert data["category"] == "product"
  assert data["aspectRatio"] == "1:1"
  assert len(data["layerBreakdown"]) > 0
  assert "recommendedAdjustments" in data
  assert data["provider"]["name"] == "mock-photo-planner"

def test_generate_photo_composition():
  plan_response = client.post(
    "/api/photo/plan",
    json={
      "intent": "Generate Luxury Perfume Poster",
      "category": "product",
      "aspectRatio": "1:1",
      "style": "luxury"
    }
  )
  plan_data = plan_response.json()
  
  response = client.post(
    "/api/photo/generate",
    json={"plan": plan_data}
  )
  assert response.status_code == 200
  data = response.json()
  assert "projectId" in data
  assert "canvas" in data
  assert len(data["layers"]) > 0
  assert data["canvas"]["aspectRatio"] == "1:1"
  assert data["layers"][0]["source"].startswith("data:image/svg+xml")


# ---------------------------------------------------------------------------
# Phase 30 — Asset Delivery Route and Security Tests
# ---------------------------------------------------------------------------
def test_asset_route_mime_and_security(monkeypatch):
    from apps.api.services.photo_gateway import _get_store
    from apps.api.services.photo_gateway import _asset_signature
    import time
    from urllib.parse import urlencode
    
    store = _get_store()
    
    # 1. Create a dummy SVG asset
    svg_id = "11111111111111111111111111111111"
    svg_file = store.assets / f"{svg_id}.svg"
    svg_file.write_text("<svg></svg>", encoding="utf-8")
    
    with store._connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO assets(asset_id, file_name, created_at, mime_type, availability_status) "
            "VALUES (?, ?, ?, ?, ?)",
            (svg_id, f"{svg_id}.svg", int(time.time()), "image/svg+xml", "available")
        )
        
    # Generate signature
    expires = int(time.time()) + 300
    path = f"/api/photo/assets/{svg_id}"
    signature = _asset_signature(path, expires)
    
    # Fetch SVG asset
    resp = client.get(f"{path}?expires={expires}&signature={signature}")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/svg+xml"
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert "no-store" in resp.headers["cache-control"]

    # 2. Create a dummy PNG asset
    png_id = "22222222222222222222222222222222"
    png_file = store.assets / f"{png_id}.png"
    png_file.write_bytes(b"\x89PNG\r\n\x1a\n")
    
    with store._connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO assets(asset_id, file_name, created_at, mime_type, availability_status) "
            "VALUES (?, ?, ?, ?, ?)",
            (png_id, f"{png_id}.png", int(time.time()), "image/png", "available")
        )
        
    expires = int(time.time()) + 300
    path = f"/api/photo/assets/{png_id}"
    signature = _asset_signature(path, expires)
    
    resp = client.get(f"{path}?expires={expires}&signature={signature}")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert resp.headers["x-content-type-options"] == "nosniff"

    # 3. Fetch unknown asset ID (must be 32 hex chars too!)
    path_unknown = "/api/photo/assets/33333333333333333333333333333333"
    signature_unknown = _asset_signature(path_unknown, expires)
    resp = client.get(f"{path_unknown}?expires={expires}&signature={signature_unknown}")
    assert resp.status_code == 404

    # 4. Fetch missing asset (410)
    with store._connect() as conn:
        conn.execute("UPDATE assets SET availability_status = 'missing' WHERE asset_id = ?", (png_id,))
    resp = client.get(f"{path}?expires={expires}&signature={signature}")
    assert resp.status_code == 410

    # 5. Fetch invalid asset (410)
    with store._connect() as conn:
        conn.execute("UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?", (png_id,))
    resp = client.get(f"{path}?expires={expires}&signature={signature}")
    assert resp.status_code == 410

    # 6. Invalid / expired signature (403)
    resp = client.get(f"{path}?expires={expires-1000}&signature={signature}")
    assert resp.status_code == 403

