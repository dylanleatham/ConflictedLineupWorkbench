"""REST API endpoints for image upload and retrieval."""

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.storage.images import MAX_IMAGE_SIZE, save_image, get_image_path

router = APIRouter(prefix="/api/images", tags=["images"])


class ImageUploadResponse(BaseModel):
    """Response for image upload."""
    hash: str


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}


@router.post("", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...)) -> ImageUploadResponse:
    """
    Upload an image.

    Validates content type and size, optimizes the image,
    and stores with content-addressed filename.

    Args:
        file: Uploaded image file

    Returns:
        Image hash

    Raises:
        HTTPException: 400 if invalid content type or size
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type '{file.content_type}'. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )

    # Read file bytes
    image_bytes = await file.read()

    # Validate size
    if len(image_bytes) > MAX_IMAGE_SIZE:
        size_mb = len(image_bytes) / (1024 * 1024)
        max_mb = MAX_IMAGE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large: {size_mb:.2f}MB (max: {max_mb:.0f}MB)"
        )

    # Save image (optimizes and deduplicates)
    image_hash = save_image(image_bytes)

    return ImageUploadResponse(hash=image_hash)


@router.get("/{image_hash}")
async def get_image(image_hash: str) -> FileResponse:
    """
    Get an image by hash.

    Args:
        image_hash: SHA-256 hash of the image

    Returns:
        Image file

    Raises:
        HTTPException: 404 if image not found
    """
    image_path = get_image_path(image_hash)

    if not image_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image '{image_hash}' not found"
        )

    return FileResponse(
        path=str(image_path),
        media_type="image/jpeg",
        filename=f"{image_hash}.jpg"
    )
