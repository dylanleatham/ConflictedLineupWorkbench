"""Storage configuration for test cases and images."""

from pathlib import Path

# Storage directory structure (relative to project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent
STORAGE_DIR = PROJECT_ROOT / ".festival-tests"
DATA_DIR = STORAGE_DIR / "data"
IMAGES_DIR = STORAGE_DIR / "images"
RESULTS_DIR = STORAGE_DIR / "results"


def ensure_dirs() -> None:
    """Create storage directories if they don't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
