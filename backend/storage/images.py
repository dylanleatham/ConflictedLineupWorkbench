"""Image storage with optimization and deduplication."""

import hashlib
from io import BytesIO
from pathlib import Path
from typing import Optional

from PIL import Image

from .config import IMAGES_DIR, ensure_dirs

# Image optimization constants
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_WIDTH = 1200  # Resize larger images
JPEG_QUALITY = 85


def optimize_image(image_bytes: bytes) -> bytes:
    """
    Optimize image for storage.

    - Converts to RGB (JPEG compatibility)
    - Resizes if width > MAX_WIDTH
    - Compresses to JPEG with quality=85

    Args:
        image_bytes: Raw image bytes

    Returns:
        Optimized JPEG bytes
    """
    # Open image
    img = Image.open(BytesIO(image_bytes))

    # Convert to RGB if needed (JPEG doesn't support RGBA, LA, P)
    if img.mode in ('RGBA', 'LA', 'P'):
        # Create white background for transparency
        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = rgb_img
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Resize if too wide
    if img.width > MAX_WIDTH:
        aspect_ratio = img.height / img.width
        new_height = int(MAX_WIDTH * aspect_ratio)
        img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

    # Save as optimized JPEG
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue()


def save_image(image_bytes: bytes) -> str:
    """
    Save image with deduplication.

    Optimizes the image, generates SHA-256 hash of optimized bytes,
    and saves to IMAGES_DIR/{hash}.jpg. If file already exists,
    skips write (deduplication).

    Args:
        image_bytes: Raw image bytes

    Returns:
        SHA-256 hash of the optimized image
    """
    # Optimize first
    optimized_bytes = optimize_image(image_bytes)

    # Generate hash of optimized image
    image_hash = hashlib.sha256(optimized_bytes).hexdigest()

    # Ensure images directory exists
    ensure_dirs()

    # Save if doesn't exist (deduplication)
    image_path = IMAGES_DIR / f"{image_hash}.jpg"
    if not image_path.exists():
        image_path.write_bytes(optimized_bytes)

    return image_hash


def get_image_path(image_hash: str) -> Optional[Path]:
    """
    Get path to stored image.

    Args:
        image_hash: SHA-256 hash of the image

    Returns:
        Path to image file if exists, None otherwise
    """
    image_path = IMAGES_DIR / f"{image_hash}.jpg"
    return image_path if image_path.exists() else None


def image_exists(image_hash: str) -> bool:
    """
    Check if image exists in storage.

    Args:
        image_hash: SHA-256 hash of the image

    Returns:
        True if image exists, False otherwise
    """
    image_path = IMAGES_DIR / f"{image_hash}.jpg"
    return image_path.exists()
