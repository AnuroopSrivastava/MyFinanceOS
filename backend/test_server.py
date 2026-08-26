import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_api_root():
    response = client.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_openapi_json():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "paths" in response.json()
    assert "/api/" in response.json()["paths"]
    assert "/api/status" in response.json()["paths"]
