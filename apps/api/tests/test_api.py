from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_production_app_serves_built_frontend():
    response = client.get("/")
    assert response.status_code == 200
    assert '<div id="root"></div>' in response.text

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "axiom-api"
    assert "version" in data
    assert "environment" in data

def test_providers_status():
    response = client.get("/api/providers/status")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    providers = data["providers"]
    assert len(providers) >= 2
    assert any(
        p["id"] == "local-brain" and p["mode"] == "local"
        for p in providers
    )

def test_brain_plan_valid():
    response = client.post(
        "/api/brain/plan",
        json={"intent": "Create Luxury Perfume Poster"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "requestId" in data
    assert data["intent"] == "Create Luxury Perfume Poster"
    assert len(data["objectives"]) > 0
    assert len(data["delegatedTasks"]) > 0
    assert data["confidence"] > 0.8
    assert data["provider"]["name"] == "local-imagine-x-planner"
    assert data["provider"]["mode"] == "local"
    assert any(route["studio"] == "Photo Studio" for route in data["routes"])
    assert all(route["mode"] == "dry-run" for route in data["routes"])
    assert data["guardian"]["status"] == "passed"
    assert data["proposal"]["status"] == "awaiting_user_approval"
    assert data["proposal"]["requiresUserApproval"] is True
    assert data["proposal"]["providerExecutionAllowed"] is False

def test_brain_plan_applies_local_recommendation_influence_without_changing_routes():
    response = client.post(
        "/api/brain/plan",
        json={
            "intent": "Create Luxury Perfume Poster",
            "recommendationInfluences": ["Prefer restrained typography."],
            "recommendationInfluenceSource": {
                "proposalId": "influence-active",
                "appliedAtUtc": "2026-07-26T00:02:00.000Z",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["recommendationInfluences"] == ["Prefer restrained typography."]
    assert data["recommendationInfluenceSource"] == {
        "proposalId": "influence-active",
        "appliedAtUtc": "2026-07-26T00:02:00.000Z",
    }
    assert any(
        objective["title"] == "Apply approved local preferences"
        and objective["description"] == "Prefer restrained typography."
        for objective in data["objectives"]
    )
    assert data["routes"][0]["mode"] == "dry-run"
    assert data["proposal"]["providerExecutionAllowed"] is False
    assert any(
        event["type"] == "recommendation_influence_applied"
        and event["metadata"]["proposalId"] == "influence-active"
        for event in data["audit"]
    )

def test_brain_plan_rejects_influence_source_without_influences():
    response = client.post(
        "/api/brain/plan",
        json={
            "intent": "Create Luxury Perfume Poster",
            "recommendationInfluenceSource": {
                "proposalId": "influence-active",
                "appliedAtUtc": "2026-07-26T00:02:00.000Z",
            },
        },
    )
    assert response.status_code == 422

def test_brain_plan_routes_multi_studio_intent():
    response = client.post(
        "/api/brain/plan",
        json={"intent": "Create an animated vector logo"}
    )
    assert response.status_code == 200
    data = response.json()
    studios = {route["studio"] for route in data["routes"]}
    assert studios == {"Vector Studio", "Motion Studio"}
    assert {route["taskId"] for route in data["routes"]} == {
        task["id"] for task in data["delegatedTasks"]
    }

def test_brain_plan_marks_ambiguous_local_route_with_lower_confidence():
    response = client.post(
        "/api/brain/plan",
        json={"intent": "Help me create something"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] == 0.82
    assert [route["studio"] for route in data["routes"]] == ["Brand Studio"]

def test_brain_plan_invalid():
    response = client.post(
        "/api/brain/plan",
        json={"intent": "ab"} # too short
    )
    assert response.status_code == 422 # Unprocessable Entity (ValidationError)
