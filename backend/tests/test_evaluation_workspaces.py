"""Behavior shared by the three workspaces via backend.api.evaluation."""

import asyncio

import pytest

from backend.api import executions, poster_search_executions, web_search_executions
from backend.api.evaluation import BatchState
from backend.main import app
from backend.tests.conftest import make_png

WEB = "/api/web-search/executions"
POSTER = "/api/poster-search/executions"


@pytest.fixture(autouse=True)
def no_batch_delay(monkeypatch):
    for module in (executions, web_search_executions, poster_search_executions):
        monkeypatch.setattr(module.workspace, "batch_delay", 0)


def web_test(test_id="fest-1", lineup=("A", "B")):
    return {"id": test_id, "festival_name": "Fest", "year": "2026", "ground_truth_lineup": list(lineup)}


def test_every_workspace_exposes_the_same_routes():
    paths = {(m, r.path) for r in app.routes for m in getattr(r, "methods", ())}
    for prefix in ("/api/executions", WEB, POSTER):
        for method, suffix in [
            ("POST", "/batch"), ("POST", "/{test_id}"),
            ("GET", "/batch/{batch_id}/progress"), ("POST", "/batch/{batch_id}/cancel"),
            ("GET", "/batch/{batch_id}/results"),
            ("GET", "/results/{test_id}"), ("GET", "/results"),
        ]:
            assert (method, prefix + suffix) in paths, (method, prefix + suffix)


def test_single_run_success_is_saved_with_metadata(client, monkeypatch):
    async def fake_extract(festival_name, system_prompt, model):
        assert festival_name == "Fest 2026"
        return ["A"]

    monkeypatch.setattr(web_search_executions, "extract_lineup_from_text", fake_extract)
    body = {**web_test(), "system_prompt": "p", "model": "m"}
    body.pop("id")

    result = client.post(f"{WEB}/fest-1", json=body).json()
    assert result["status"] == "success"
    assert result["accuracy"]["accuracy_percentage"] == 50.0
    assert result["metadata"]["festival_name"] == "Fest" and result["metadata"]["model"] == "m"
    assert client.get(f"{WEB}/results/fest-1").json() == result


def test_single_run_failure_is_returned_and_saved(client, monkeypatch):
    async def boom(**kwargs):
        raise TimeoutError("Claude API call timed out")

    monkeypatch.setattr(web_search_executions, "extract_lineup_from_text", boom)
    body = {**web_test(), "system_prompt": "p", "model": "m"}
    body.pop("id")

    response = client.post(f"{WEB}/fest-1", json=body)
    assert response.status_code == 200
    assert response.json()["status"] == "failed"
    assert "timed out" in response.json()["error"]
    assert client.get(f"{WEB}/results/fest-1").json()["status"] == "failed"


def test_failed_poster_search_keeps_claude_response(client, monkeypatch):
    image_hash = client.post("/api/images", files={"file": ("p.png", make_png(), "image/png")}).json()["hash"]

    async def fake_find(**kwargs):
        return {"poster_url": None, "source_url": "https://x.test/lineup"}

    monkeypatch.setattr(poster_search_executions, "extract_poster_url", fake_find)
    result = client.post(f"{POSTER}/fest-1", json={
        "festival_name": "Fest", "year": "2026", "image_hash": image_hash, "system_prompt": "p", "model": "m",
    }).json()

    assert result["status"] == "failed"
    assert result["error"] == "Claude response missing poster_url field"
    assert result["claude_response"]["source_url"] == "https://x.test/lineup"


def test_poster_search_similarity_and_summary(client, monkeypatch):
    png = make_png()
    image_hash = client.post("/api/images", files={"file": ("p.png", png, "image/png")}).json()["hash"]
    stored = client.get(f"/api/images/{image_hash}").content

    async def fake_find(**kwargs):
        return {"poster_url": "https://x.test/p.jpg"}

    async def fake_download(url):
        return stored

    monkeypatch.setattr(poster_search_executions, "extract_poster_url", fake_find)
    monkeypatch.setattr(poster_search_executions, "download_image", fake_download)

    tests = [{"id": "fest-1", "festival_name": "Fest", "year": "2026", "image_hash": image_hash}]
    batch_id = client.post(f"{POSTER}/batch", json={"tests": tests, "system_prompt": "p", "model": "m"}).json()["batch_id"]
    summary = client.get(f"{POSTER}/batch/{batch_id}/results").json()

    assert summary["high_similarity_count"] == 1
    assert summary["average_similarity"] == 100.0


def test_batch_counts_failures_within_completed(client, monkeypatch):
    async def fake_extract(festival_name, system_prompt, model):
        if festival_name.startswith("Bad"):
            raise ValueError("Could not parse JSON array from response")
        return ["A", "B"]

    monkeypatch.setattr(web_search_executions, "extract_lineup_from_text", fake_extract)
    tests = [web_test("ok-1"), {**web_test("bad-1"), "festival_name": "Bad"}, web_test("ok-2", lineup=("A", "C"))]
    batch_id = client.post(f"{WEB}/batch", json={"tests": tests, "system_prompt": "p", "model": "m"}).json()["batch_id"]

    progress = client.get(f"{WEB}/batch/{batch_id}/progress").json()
    assert progress == {"total": 3, "completed": 3, "failed": 1, "cancelled": False, "current_test_id": None}

    summary = client.get(f"{WEB}/batch/{batch_id}/results").json()
    assert summary["perfect_count"] == 1
    assert summary["average_accuracy"] == 75.0  # mean of successful runs only
    assert [r["status"] for r in summary["results"]] == ["success", "failed", "success"]


def test_cancel_stops_before_the_next_test(monkeypatch):
    state = BatchState(total=2, system_prompt="p", model="m")
    calls = []

    async def fake_extract(festival_name, system_prompt, model):
        calls.append(festival_name)
        state.cancelled = True  # user cancels while the first test is running
        return ["A"]

    monkeypatch.setattr(web_search_executions, "extract_lineup_from_text", fake_extract)
    tests = [(t["id"], web_search_executions.WebSearchTestInput(**t)) for t in (web_test("a"), web_test("b"))]
    asyncio.run(web_search_executions.workspace._run_batch(state, tests))

    assert len(calls) == 1
    assert state.completed == 1 and state.current_test_id is None
    assert state.progress().cancelled


def test_cancel_during_pause_between_tests_runs_nothing_more(monkeypatch):
    state = BatchState(total=2, system_prompt="p", model="m")
    calls = []

    async def fake_extract(festival_name, system_prompt, model):
        calls.append(festival_name)
        return ["A"]

    async def pause_then_cancel(seconds):
        state.cancelled = True  # user cancels while the runner waits between tests

    monkeypatch.setattr(web_search_executions, "extract_lineup_from_text", fake_extract)
    monkeypatch.setattr("backend.api.evaluation.asyncio.sleep", pause_then_cancel)
    tests = [(t["id"], web_search_executions.WebSearchTestInput(**t)) for t in (web_test("a"), web_test("b"))]
    asyncio.run(web_search_executions.workspace._run_batch(state, tests))

    assert len(calls) == 1 and state.completed == 1


def test_unknown_batch_is_404(client):
    assert client.get(f"{WEB}/batch/nope/progress").status_code == 404


def test_empty_batch_is_rejected(client):
    assert client.post(f"{WEB}/batch", json={"tests": [], "system_prompt": "p", "model": "m"}).status_code == 400


def test_unsafe_single_test_id_is_rejected(client):
    body = {"festival_name": "F", "year": "2026", "ground_truth_lineup": [], "system_prompt": "p", "model": "m"}
    assert client.post(f"{WEB}/..%5Cx", json=body).status_code == 422
