"""Persistence for prompt configuration."""

import json
import tempfile
from pathlib import Path
import logging

from .models import PromptConfig
from .config import STORAGE_DIR, ensure_dirs

logger = logging.getLogger(__name__)

# Single config file for prompt settings
CONFIG_FILE = STORAGE_DIR / "prompt_config.json"


def save_prompt_config(config: PromptConfig) -> None:
    """
    Save prompt configuration to JSON file using atomic write pattern.

    Args:
        config: PromptConfig model to save
    """
    ensure_dirs()

    # Atomic write: temp file + rename
    with tempfile.NamedTemporaryFile(
        mode='w',
        dir=STORAGE_DIR,
        delete=False,
        encoding='utf-8',
        suffix='.json'
    ) as tmp:
        json_data = json.loads(config.model_dump_json())
        json.dump(json_data, tmp, indent=2, ensure_ascii=False)
        tmp_path = Path(tmp.name)

    # Atomic rename
    tmp_path.replace(CONFIG_FILE)


def load_prompt_config() -> PromptConfig:
    """
    Load prompt configuration from JSON file.

    Returns:
        PromptConfig object. Returns default config if file doesn't exist.
    """
    if not CONFIG_FILE.exists():
        return PromptConfig()

    try:
        with CONFIG_FILE.open('r', encoding='utf-8') as f:
            data = json.load(f)
            return PromptConfig(**data)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted prompt config file: {e}")
        return PromptConfig()
    except Exception as e:
        logger.error(f"Error loading prompt config: {e}")
        return PromptConfig()
