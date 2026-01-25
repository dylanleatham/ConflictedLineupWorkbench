"""Pydantic models for test cases and prompt configuration."""

from pydantic import BaseModel, Field
from typing import List, Optional


class PromptConfig(BaseModel):
    """Model for prompt configuration."""
    system_prompt: str = Field(
        default="Extract the festival lineup from this image. Return a JSON array of artist names.",
        description="System prompt sent to Claude API"
    )
    claude_model: str = Field(
        default="claude-sonnet-4-20250514",
        description="Claude model identifier"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "system_prompt": "Extract the festival lineup from this image. Return a JSON array of artist names.",
                "claude_model": "claude-sonnet-4-20250514"
            }
        }
    }


class TestCase(BaseModel):
    """Model for a festival test case."""
    id: str = Field(..., description="Unique identifier for the test case")
    name: str = Field(..., description="Festival name (e.g., 'Coachella 2024')")
    image_hash: Optional[str] = Field(None, description="SHA-256 hash of stored image, None if no image")
    lineup: List[str] = Field(default_factory=list, description="Ground truth list of artist names")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "001-coachella-2024",
                "name": "Coachella 2024",
                "image_hash": "a1b2c3d4e5f6...",
                "lineup": ["The Weeknd", "Daft Punk", "Billie Eilish"]
            }
        }
    }
