"""Storage configuration for test cases and images."""

import os
import re
from pathlib import Path

# Storage directory structure (relative to project root).
# Override with FESTIVAL_STORAGE_DIR, e.g. to isolate test runs.
PROJECT_ROOT = Path(__file__).parent.parent.parent
STORAGE_DIR = Path(os.environ.get("FESTIVAL_STORAGE_DIR", PROJECT_ROOT / ".festival-tests"))
DATA_DIR = STORAGE_DIR / "data"
IMAGES_DIR = STORAGE_DIR / "images"
RESULTS_DIR = STORAGE_DIR / "results"

# IDs and hashes become filenames, so restrict them to a safe character set
# to prevent path traversal (e.g. "..\\..\\secrets").
_SAFE_ID = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def is_safe_id(value: str) -> bool:
    """Return True if value is safe to use as a storage filename stem."""
    return bool(_SAFE_ID.match(value))


def ensure_dirs() -> None:
    """Create storage directories if they don't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
