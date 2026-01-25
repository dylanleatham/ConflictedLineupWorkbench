"""Claude API integration service for lineup extraction."""

import asyncio
import base64
import json
import os
import re
from pathlib import Path
from typing import List

from anthropic import AsyncAnthropic
from PIL import Image


def parse_claude_json_response(response_text: str) -> List[str]:
    """
    Parse Claude's response to extract a JSON array of artist names.

    Handles multiple formats:
    - Direct JSON array: ["Artist1", "Artist2"]
    - Markdown code fence: ```json\n["Artist1"]\n```
    - Array embedded in text

    Args:
        response_text: Raw text response from Claude

    Returns:
        List of artist names

    Raises:
        ValueError: If response cannot be parsed as JSON array
    """
    text = response_text.strip()

    # Try direct JSON parse first
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return [str(item) for item in result]
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code fence
    code_fence_pattern = r'```(?:json)?\s*\n?([\s\S]*?)\n?```'
    match = re.search(code_fence_pattern, text)
    if match:
        try:
            result = json.loads(match.group(1).strip())
            if isinstance(result, list):
                return [str(item) for item in result]
        except json.JSONDecodeError:
            pass

    # Try finding array pattern as fallback
    array_pattern = r'\[[\s\S]*?\]'
    match = re.search(array_pattern, text)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, list):
                return [str(item) for item in result]
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON array from response: {text[:200]}...")


async def extract_lineup_from_text(
    festival_name: str,
    system_prompt: str,
    model: str,
    timeout: float = 60.0
) -> List[str]:
    """
    Extract lineup from festival name using Claude's knowledge.

    Args:
        festival_name: Name of the festival (e.g., "Coachella 2024")
        system_prompt: System prompt instructing Claude on output format
        model: Claude model ID (e.g., "claude-sonnet-4-20250514")
        timeout: Maximum seconds to wait for API response

    Returns:
        List of artist names extracted by Claude

    Raises:
        asyncio.TimeoutError: If API call exceeds timeout
        anthropic.RateLimitError: If rate limited (SDK handles retries)
        ValueError: If response cannot be parsed
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = AsyncAnthropic(api_key=api_key)

    try:
        response = await asyncio.wait_for(
            client.messages.create(
                model=model,
                max_tokens=4096,
                system=system_prompt,
                tools=[
                    {
                        "type": "web_search_20250305",
                        "name": "web_search"
                    }
                ],
                messages=[
                    {
                        "role": "user",
                        "content": f"Festival: {festival_name}"
                    }
                ]
            ),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        raise asyncio.TimeoutError(
            f"Claude API call timed out after {timeout} seconds for festival: {festival_name}"
        )

    # Extract text content from response
    response_text = ""
    for block in response.content:
        if block.type == "text":
            response_text += block.text

    return parse_claude_json_response(response_text)


async def extract_lineup_from_image(
    image_path: Path,
    system_prompt: str,
    model: str,
    timeout: float = 60.0
) -> List[str]:
    """
    Extract lineup from festival poster image using Claude's vision.

    Args:
        image_path: Path to the image file
        system_prompt: System prompt instructing Claude on output format
        model: Claude model ID (must support vision, e.g., "claude-sonnet-4-20250514")
        timeout: Maximum seconds to wait for API response

    Returns:
        List of artist names extracted by Claude

    Raises:
        asyncio.TimeoutError: If API call exceeds timeout
        anthropic.RateLimitError: If rate limited (SDK handles retries)
        ValueError: If response cannot be parsed or image format invalid
        FileNotFoundError: If image file doesn't exist
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Detect media type using Pillow
    with Image.open(image_path) as img:
        format_lower = img.format.lower() if img.format else ""

    # Map Pillow format to media type
    format_map = {
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }

    media_type = format_map.get(format_lower)
    if not media_type:
        raise ValueError(
            f"Unsupported image format: {format_lower}. "
            "Supported formats: jpeg, png, gif, webp"
        )

    # Read and base64 encode the image
    image_data = base64.standard_b64encode(image_path.read_bytes()).decode("utf-8")

    client = AsyncAnthropic(api_key=api_key)

    try:
        response = await asyncio.wait_for(
            client.messages.create(
                model=model,
                max_tokens=4096,
                system=system_prompt,
                tools=[
                    {
                        "type": "web_search_20250305",
                        "name": "web_search"
                    }
                ],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_data
                                }
                            },
                            {
                                "type": "text",
                                "text": "Extract the lineup from this festival poster."
                            }
                        ]
                    }
                ]
            ),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        raise asyncio.TimeoutError(
            f"Claude API call timed out after {timeout} seconds for image: {image_path}"
        )

    # Extract text content from response
    response_text = ""
    for block in response.content:
        if block.type == "text":
            response_text += block.text

    return parse_claude_json_response(response_text)
