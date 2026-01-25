"""API endpoints for prompt configuration."""

from fastapi import APIRouter

from backend.storage.models import PromptConfig
from backend.storage.prompts import load_prompt_config, save_prompt_config

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


@router.get("", response_model=PromptConfig)
async def get_prompt_config():
    """
    Get current prompt configuration.

    Returns default config if none saved.
    """
    return load_prompt_config()


@router.put("", response_model=PromptConfig)
async def update_prompt_config(config: PromptConfig):
    """
    Update prompt configuration.

    Args:
        config: New prompt configuration

    Returns:
        Updated configuration
    """
    save_prompt_config(config)
    return config
