"""Shared fixtures. Storage is redirected to a temp dir before the app is imported."""

import os
import shutil
import tempfile
from io import BytesIO

import pytest

os.environ["FESTIVAL_STORAGE_DIR"] = tempfile.mkdtemp(prefix="festival-tests-")
# Set before the app runs load_dotenv (which never overrides existing vars),
# so a developer's real key in .env can't be picked up by the test run.
os.environ["ANTHROPIC_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from backend.main import app  # noqa: E402
from backend.services import claude  # noqa: E402
from backend.storage import config  # noqa: E402


@pytest.fixture(autouse=True)
def no_real_api_calls(monkeypatch):
    """Fail loudly if a test reaches the Anthropic API instead of a fake."""
    def refuse():
        raise AssertionError("Test tried to call the real Claude API; monkeypatch the extractor")

    monkeypatch.setattr(claude, "_get_client", refuse)


@pytest.fixture(autouse=True)
def clean_storage():
    """Give every test an empty storage directory."""
    shutil.rmtree(config.STORAGE_DIR, ignore_errors=True)
    config.ensure_dirs()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def make_png(color=(200, 30, 30), size=(64, 96)) -> bytes:
    """Return the bytes of a solid-color PNG."""
    buf = BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()
