"""Claude API integration service for lineup extraction."""

import asyncio
import base64
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Callable, List, Optional

from anthropic import AsyncAnthropic, RateLimitError
from PIL import Image

logger = logging.getLogger(__name__)

# Retry settings (tuned for tokens-per-minute rate limits)
MAX_RETRIES = 5
INITIAL_BACKOFF = 15.0  # seconds
MAX_BACKOFF = 120.0  # seconds

DEFAULT_TIMEOUT = 120.0  # seconds
MAX_TOKENS = 4096
WEB_SEARCH_TOOL = {"type": "web_search_20250305", "name": "web_search"}

# Pillow format name -> Messages API media type
IMAGE_MEDIA_TYPES = {
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
}

_CODE_FENCE = re.compile(r"```(?:json)?\s*\n?([\s\S]*?)\n?```")

_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    """Return a shared AsyncAnthropic client, created on first use."""
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        _client = AsyncAnthropic(api_key=api_key)
    return _client


async def _call_with_retry(client: AsyncAnthropic, **kwargs) -> Any:
    """Call client.messages.create with exponential backoff on rate limits."""
    for attempt in range(MAX_RETRIES):
        try:
            return await client.messages.create(**kwargs)
        except RateLimitError as e:
            if attempt == MAX_RETRIES - 1:
                raise
            backoff = min(INITIAL_BACKOFF * (2 ** attempt), MAX_BACKOFF)
            logger.warning(
                f"Rate limited (attempt {attempt + 1}/{MAX_RETRIES}), "
                f"retrying in {backoff:.1f}s: {e}"
            )
            await asyncio.sleep(backoff)


async def _ask_claude_with_web_search(
    content: Any,
    system_prompt: str,
    model: str,
    timeout: float,
    context: str,
) -> str:
    """
    Send one user message to Claude with the web search tool enabled.

    Args:
        content: User message content (string or list of content blocks)
        system_prompt: System prompt
        model: Claude model ID
        timeout: Maximum seconds to wait, including rate-limit retries
        context: Short description used in the timeout error message

    Returns:
        Concatenated text blocks from Claude's response
    """
    client = _get_client()
    try:
        response = await asyncio.wait_for(
            _call_with_retry(
                client,
                model=model,
                max_tokens=MAX_TOKENS,
                system=system_prompt,
                tools=[WEB_SEARCH_TOOL],
                messages=[{"role": "user", "content": content}],
            ),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        raise asyncio.TimeoutError(
            f"Claude API call timed out after {timeout} seconds for {context}"
        )

    return "".join(block.text for block in response.content if block.type == "text")


def _parse_json_candidates(text: str, accept: Callable[[Any], Any]) -> Any:
    """
    Try progressively looser strategies to pull JSON out of a model response.

    Order: the whole text, the first markdown code fence, then the first
    bracketed substring. `accept` returns the parsed value to use, or None
    to reject it and keep looking.
    """
    text = text.strip()
    candidates = [text]
    fence = _CODE_FENCE.search(text)
    if fence:
        candidates.append(fence.group(1).strip())
    for pattern in (r"\[[\s\S]*?\]", r"\{[\s\S]*\}"):
        match = re.search(pattern, text)
        if match:
            candidates.append(match.group())

    for candidate in candidates:
        try:
            value = accept(json.loads(candidate))
        except json.JSONDecodeError:
            continue
        if value is not None:
            return value
    return None


def parse_claude_json_response(response_text: str) -> List[str]:
    """
    Parse Claude's response to extract a list of artist names.

    Accepts a bare JSON array (["A", "B"]) or an object with an "artists"
    array ({"artists": ["A", "B"], ...}), either on its own, inside a
    markdown code fence, or embedded in surrounding prose.

    Raises:
        ValueError: If no artist list can be found
    """
    def accept(value: Any) -> Optional[List[str]]:
        if isinstance(value, dict):
            value = value.get("artists")
        if isinstance(value, list):
            return [str(item) for item in value]
        return None

    artists = _parse_json_candidates(response_text, accept)
    if artists is None:
        raise ValueError(f"Could not parse JSON array from response: {response_text.strip()[:200]}...")
    return artists


def parse_claude_poster_response(response_text: str) -> dict:
    """
    Parse Claude's poster search response into a dict containing at least
    "poster_url" (plus optional "source_url" and "lineup_text").

    Raises:
        ValueError: If no JSON object with a poster_url can be found
    """
    def accept(value: Any) -> Optional[dict]:
        return value if isinstance(value, dict) and "poster_url" in value else None

    obj = _parse_json_candidates(response_text, accept)
    if obj is None:
        raise ValueError(f"Could not parse poster search JSON from response: {response_text.strip()[:200]}...")
    return obj


async def extract_lineup_from_text(
    festival_name: str,
    system_prompt: str,
    model: str,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[str]:
    """
    Extract a lineup from a festival name using Claude with web search.

    Used by the Web Search Evals workspace.

    Raises:
        asyncio.TimeoutError: If the API call exceeds timeout
        ValueError: If the API key is missing or the response can't be parsed
    """
    response_text = await _ask_claude_with_web_search(
        f"Festival: {festival_name}", system_prompt, model, timeout,
        context=f"festival: {festival_name}",
    )
    return parse_claude_json_response(response_text)


async def extract_poster_url(
    festival_name: str,
    system_prompt: str,
    model: str,
    timeout: float = DEFAULT_TIMEOUT,
) -> dict:
    """
    Ask Claude (with web search) to find the official poster for a festival.

    Used by the Poster Search Evals workspace.

    Returns:
        Dict with poster_url, and optionally source_url and lineup_text

    Raises:
        asyncio.TimeoutError: If the API call exceeds timeout
        ValueError: If the API key is missing or the response can't be parsed
    """
    response_text = await _ask_claude_with_web_search(
        f"Festival: {festival_name}", system_prompt, model, timeout,
        context=f"festival: {festival_name}",
    )
    return parse_claude_poster_response(response_text)


async def extract_lineup_from_image(
    image_path: Path,
    system_prompt: str,
    model: str,
    timeout: float = DEFAULT_TIMEOUT,
) -> List[str]:
    """
    Extract a lineup from a festival poster image using Claude's vision.

    Web search stays enabled so prompts can have Claude cross-check the
    poster against published lineups.

    Raises:
        asyncio.TimeoutError: If the API call exceeds timeout
        ValueError: If the API key is missing, the format is unsupported,
            or the response can't be parsed
        FileNotFoundError: If the image file doesn't exist
    """
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    with Image.open(image_path) as img:
        image_format = (img.format or "").lower()

    media_type = IMAGE_MEDIA_TYPES.get(image_format)
    if not media_type:
        raise ValueError(
            f"Unsupported image format: {image_format}. "
            "Supported formats: jpeg, png, gif, webp"
        )

    image_data = base64.standard_b64encode(image_path.read_bytes()).decode("utf-8")
    content = [
        {
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": image_data},
        },
        {"type": "text", "text": "Extract the lineup from this festival poster."},
    ]

    response_text = await _ask_claude_with_web_search(
        content, system_prompt, model, timeout, context=f"image: {image_path.name}",
    )
    return parse_claude_json_response(response_text)
