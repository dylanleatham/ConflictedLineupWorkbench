"""Storage package for test case and image persistence."""

from .config import STORAGE_DIR, DATA_DIR, IMAGES_DIR, RESULTS_DIR, ensure_dirs
from .models import TestCase, PromptConfig
from .test_cases import save_test_case, load_test_case, load_all_test_cases, delete_test_case
from .images import save_image, get_image_path, image_exists
from .prompts import save_prompt_config, load_prompt_config
from .results import save_result, load_result, load_all_results, delete_result

__all__ = [
    # Config
    "STORAGE_DIR",
    "DATA_DIR",
    "IMAGES_DIR",
    "RESULTS_DIR",
    "ensure_dirs",
    # Models
    "TestCase",
    "PromptConfig",
    # Test case CRUD
    "save_test_case",
    "load_test_case",
    "load_all_test_cases",
    "delete_test_case",
    # Image storage
    "save_image",
    "get_image_path",
    "image_exists",
    # Prompt config
    "save_prompt_config",
    "load_prompt_config",
    # Results
    "save_result",
    "load_result",
    "load_all_results",
    "delete_result",
]
