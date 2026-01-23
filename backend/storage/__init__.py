"""Storage package for test case and image persistence."""

from .config import STORAGE_DIR, DATA_DIR, IMAGES_DIR, ensure_dirs
from .models import TestCase
from .test_cases import save_test_case, load_test_case, load_all_test_cases, delete_test_case
from .images import save_image, get_image_path, image_exists

__all__ = [
    # Config
    "STORAGE_DIR",
    "DATA_DIR",
    "IMAGES_DIR",
    "ensure_dirs",
    # Models
    "TestCase",
    # Test case CRUD
    "save_test_case",
    "load_test_case",
    "load_all_test_cases",
    "delete_test_case",
    # Image storage
    "save_image",
    "get_image_path",
    "image_exists",
]
