"""CRUD operations for test case persistence."""

import json
import tempfile
from pathlib import Path
from typing import List, Optional
import logging

from .models import TestCase
from .config import DATA_DIR, ensure_dirs

logger = logging.getLogger(__name__)


def save_test_case(test_case: TestCase) -> None:
    """
    Save test case to JSON file using atomic write pattern.

    Args:
        test_case: TestCase model to save
    """
    ensure_dirs()
    file_path = DATA_DIR / f"{test_case.id}.json"

    # Atomic write: temp file + rename
    with tempfile.NamedTemporaryFile(
        mode='w',
        dir=DATA_DIR,
        delete=False,
        encoding='utf-8',
        suffix='.json'
    ) as tmp:
        # Use model_dump_json for proper Pydantic serialization
        json_data = json.loads(test_case.model_dump_json())
        json.dump(json_data, tmp, indent=2, ensure_ascii=False)
        tmp_path = Path(tmp.name)

    # Atomic rename
    tmp_path.replace(file_path)


def load_test_case(test_case_id: str) -> Optional[TestCase]:
    """
    Load a test case from JSON file.

    Args:
        test_case_id: Unique ID of the test case

    Returns:
        TestCase object if found, None if file doesn't exist
    """
    file_path = DATA_DIR / f"{test_case_id}.json"

    if not file_path.exists():
        return None

    try:
        with file_path.open('r', encoding='utf-8') as f:
            data = json.load(f)
            return TestCase(**data)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted JSON file {file_path}: {e}")
        return None


def load_all_test_cases() -> List[TestCase]:
    """
    Load all test cases from data directory.

    Returns:
        List of TestCase objects. Skips corrupted files with logging.
    """
    ensure_dirs()
    test_cases = []

    for json_file in DATA_DIR.glob("*.json"):
        try:
            with json_file.open('r', encoding='utf-8') as f:
                data = json.load(f)
                test_cases.append(TestCase(**data))
        except json.JSONDecodeError as e:
            logger.warning(f"Skipping corrupted file {json_file}: {e}")
            continue
        except Exception as e:
            logger.warning(f"Skipping invalid test case {json_file}: {e}")
            continue

    return test_cases


def delete_test_case(test_case_id: str) -> bool:
    """
    Delete a test case JSON file.

    Note: Does NOT delete associated image (may be shared by other test cases).

    Args:
        test_case_id: Unique ID of the test case

    Returns:
        True if file was deleted, False if file didn't exist
    """
    file_path = DATA_DIR / f"{test_case_id}.json"

    if not file_path.exists():
        return False

    file_path.unlink()
    return True
