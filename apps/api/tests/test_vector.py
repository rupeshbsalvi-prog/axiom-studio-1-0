from fastapi.testclient import TestClient
import pytest
from apps.api.main import app
from apps.api.services import auth_session
from apps.api.tests.conftest import authenticate_workspace_client

client = TestClient(app)


@pytest.fixture(autouse=True)
def authenticated_planner_client():
  auth_session._store = None
  auth_session._store_root = None
  authenticate_workspace_client(client)
  yield
  client.cookies.clear()
  auth_session._store = None
  auth_session._store_root = None

def test_get_vector_templates():
  response = client.get("/api/vector/templates")
  assert response.status_code == 200
  data = response.json()
  assert "categories" in data
  assert "aesthetics" in data
  assert "aspectRatios" in data
  assert "palettes" in data
  assert "logo" in data["categories"]

def test_plan_vector_composition():
  response = client.post(
    "/api/vector/plan",
    json={
      "intent": "Generate Futuristic Icon Pack",
      "category": "icon",
      "aspectRatio": "1:1",
      "style": "futuristic"
    }
  )
  assert response.status_code == 200
  data = response.json()
  assert data["intent"] == "Generate Futuristic Icon Pack"
  assert data["category"] == "icon"
  assert len(data["shapeBreakdown"]) > 0
  assert data["provider"]["name"] == "mock-vector-planner"

def test_generate_vector_composition():
  plan_response = client.post(
    "/api/vector/plan",
    json={
      "intent": "Generate Futuristic Icon Pack",
      "category": "icon",
      "aspectRatio": "1:1",
      "style": "futuristic"
    }
  )
  plan_data = plan_response.json()

  response = client.post(
    "/api/vector/generate",
    json={"plan": plan_data}
  )
  assert response.status_code == 200
  data = response.json()
  assert "projectId" in data
  assert "canvas" in data
  assert len(data["shapes"]) > 0
  assert data["canvas"]["viewBox"] == "0 0 1024 1024"
