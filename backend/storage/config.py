"""Storage configuration for test cases and images."""

from pathlib import Path

# Storage directory structure
STORAGE_DIR = Path(".festival-tests")
DATA_DIR = STORAGE_DIR / "data"
IMAGES_DIR = STORAGE_DIR / "images"


def ensure_dirs() -> None:
    """Create storage directories if they don't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
