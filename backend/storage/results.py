"""CRUD operations for test execution result persistence."""

import json
import tempfile
from pathlib import Path
from typing import Optional
import logging

from .config import RESULTS_DIR, ensure_dirs

logger = logging.getLogger(__name__)


def _workspace_dir(workspace: str) -> Path:
    """Get the results subdirectory for a workspace."""
    d = RESULTS_DIR / workspace
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_result(test_id: str, result: dict, workspace: str = "image-eval") -> None:
    """Save the last execution result for a test case."""
    ensure_dirs()
    ws_dir = _workspace_dir(workspace)
    file_path = ws_dir / f"{test_id}.json"

    with tempfile.NamedTemporaryFile(
        mode='w',
        dir=ws_dir,
        delete=False,
        encoding='utf-8',
        suffix='.json'
    ) as tmp:
        json.dump(result, tmp, indent=2, ensure_ascii=False)
        tmp_path = Path(tmp.name)

    tmp_path.replace(file_path)


def load_result(test_id: str, workspace: str = "image-eval") -> Optional[dict]:
    """Load the last execution result for a test case."""
    file_path = _workspace_dir(workspace) / f"{test_id}.json"

    if not file_path.exists():
        return None

    try:
        with file_path.open('r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted result file {file_path}: {e}")
        return None


def load_all_results(workspace: str = "image-eval") -> dict:
    """Load all saved results. Returns dict of test_id -> result."""
    ensure_dirs()
    ws_dir = _workspace_dir(workspace)
    results = {}

    for json_file in ws_dir.glob("*.json"):
        test_id = json_file.stem
        try:
            with json_file.open('r', encoding='utf-8') as f:
                results[test_id] = json.load(f)
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Skipping corrupted result {json_file}: {e}")
            continue

    return results


def delete_result(test_id: str, workspace: str = "image-eval") -> bool:
    """Delete the saved result for a test case."""
    file_path = _workspace_dir(workspace) / f"{test_id}.json"

    if not file_path.exists():
        return False

    file_path.unlink()
    return True
