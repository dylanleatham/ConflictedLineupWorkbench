from backend.api import executions
from backend.tests.conftest import make_png


def test_test_case_crud(client):
    created = client.post("/api/test-cases", json={"name": "Lost Lands 2025", "lineup": ["Excision"]})
    assert created.status_code == 201
    test_id = created.json()["id"]
    assert test_id.startswith("lost-lands-2025-")

    assert client.get(f"/api/test-cases/{test_id}").json()["lineup"] == ["Excision"]
    updated = client.put(f"/api/test-cases/{test_id}", json={"lineup": ["Excision", "Rezz"]})
    assert updated.json()["lineup"] == ["Excision", "Rezz"]
    assert len(client.get("/api/test-cases").json()) == 1

    assert client.delete(f"/api/test-cases/{test_id}").status_code == 204
    assert client.get(f"/api/test-cases/{test_id}").status_code == 404


def test_path_traversal_id_is_not_found(client):
    assert client.get("/api/test-cases/..%5C..%5Cetc").status_code == 404


def test_image_upload_and_fetch(client):
    uploaded = client.post("/api/images", files={"file": ("p.png", make_png(), "image/png")})
    assert uploaded.status_code == 201
    fetched = client.get(f"/api/images/{uploaded.json()['hash']}")
    assert fetched.status_code == 200
    assert fetched.headers["content-type"] == "image/jpeg"


def test_image_upload_rejects_non_images(client):
    response = client.post("/api/images", files={"file": ("a.txt", b"hi", "text/plain")})
    assert response.status_code == 400


def test_prompt_config_round_trip(client):
    config = {"system_prompt": "Return JSON.", "claude_model": "claude-sonnet-4-6"}
    assert client.put("/api/prompts", json=config).status_code == 200
    assert client.get("/api/prompts").json() == config


def test_image_batch_route_is_not_shadowed_by_single_test_route(client, monkeypatch):
    """Regression: POST /batch used to match POST /{test_id} with test_id='batch'."""
    async def fake_extract(image_path, system_prompt, model):
        return ["Excision", "Rezz"]

    monkeypatch.setattr(executions, "extract_lineup_from_image", fake_extract)

    upload = client.post("/api/images", files={"file": ("p.png", make_png(), "image/png")})
    test_id = client.post("/api/test-cases", json={
        "name": "Lost Lands 2025",
        "lineup": ["Excision", "Rezz", "Subtronics"],
        "image_hash": upload.json()["hash"],
    }).json()["id"]

    started = client.post("/api/executions/batch", json={
        "test_ids": [test_id], "system_prompt": "p", "model": "m",
    })
    assert started.status_code == 200, started.text
    batch_id = started.json()["batch_id"]

    summary = client.get(f"/api/executions/batch/{batch_id}/results").json()
    assert summary["completed"] == 1 and summary["failed"] == 0
    assert summary["results"][0]["accuracy"]["accuracy_percentage"] == 66.67
    assert client.get(f"/api/executions/results/{test_id}").status_code == 200


def test_web_search_batch_rejects_unsafe_ids(client):
    response = client.post("/api/web-search/executions/batch", json={
        "tests": [{"id": "../x", "festival_name": "F", "year": "2025", "ground_truth_lineup": []}],
        "system_prompt": "p",
        "model": "m",
    })
    assert response.status_code == 422
