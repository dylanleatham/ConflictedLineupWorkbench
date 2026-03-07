"""Image similarity comparison service using SSIM."""

import io
import logging
from pathlib import Path

import httpx
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

logger = logging.getLogger(__name__)


async def download_image(url: str, timeout: float = 30.0) -> bytes:
    """
    Download an image from a URL.

    Args:
        url: Image URL to download
        timeout: Request timeout in seconds

    Returns:
        Raw image bytes

    Raises:
        httpx.HTTPError: If download fails
    """
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if content_type and not content_type.startswith("image/"):
            raise ValueError(
                f"URL did not return an image (content-type: {content_type}). "
                f"The URL may be invalid or blocked."
            )
        # Verify the bytes are actually a valid image
        try:
            Image.open(io.BytesIO(response.content)).verify()
        except Exception:
            raise ValueError(
                f"Downloaded content is not a valid image. "
                f"The URL may point to an HTML page or other non-image content."
            )
        return response.content


def compute_image_similarity(ground_truth_path: Path, candidate_bytes: bytes) -> dict:
    """
    Compare two images using SSIM (Structural Similarity Index).

    Args:
        ground_truth_path: Path to the ground truth image file
        candidate_bytes: Raw bytes of the candidate image

    Returns:
        dict with similarity_percentage, ssim_raw, and method
    """
    # Load images
    gt_img = Image.open(ground_truth_path).convert("L")
    candidate_img = Image.open(io.BytesIO(candidate_bytes)).convert("L")

    # Resize candidate to match ground truth dimensions
    if candidate_img.size != gt_img.size:
        candidate_img = candidate_img.resize(gt_img.size, Image.LANCZOS)

    # Convert to numpy arrays
    gt_array = np.array(gt_img)
    candidate_array = np.array(candidate_img)

    # Compute SSIM
    ssim_value = structural_similarity(gt_array, candidate_array)

    return {
        "similarity_percentage": round(max(0, ssim_value) * 100, 2),
        "ssim_raw": round(ssim_value, 6),
        "method": "ssim"
    }
