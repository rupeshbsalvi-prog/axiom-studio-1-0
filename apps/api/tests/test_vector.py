from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

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
