"""Pydantic models for test cases."""

from pydantic import BaseModel, Field
from typing import List, Optional


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
