"""REST API endpoints for test execution and evaluation."""

import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.services import calculate_accuracy, extract_lineup_from_text, extract_lineup_from_image
from backend.storage import load_test_case, IMAGES_DIR

router = APIRouter(prefix="/api/executions", tags=["executions"])


# Request/Response models for individual execution
class ExecutionRequest(BaseModel):
    """Request body for executing a test."""
    system_prompt: str
    model: str


class AccuracyResult(BaseModel):
    """Accuracy calculation result."""
    total_ground_truth: int
    total_extracted: int
    matched: int
    accuracy_percentage: float
    missed: List[str]
    extra: List[str]
    matched_artists: List[str]


class ExecutionResult(BaseModel):
    """Result of a single test execution."""
    test_id: str
    status: str  # "success" or "failed"
    extracted_lineup: Optional[List[str]] = None
    accuracy: Optional[AccuracyResult] = None
    error: Optional[str] = None
    metadata: dict  # model, system_prompt, timestamp


@router.post("/{test_id}/{mode}", response_model=ExecutionResult)
async def execute_test(test_id: str, mode: str, request: ExecutionRequest) -> ExecutionResult:
    """
    Execute a single test case against Claude.

    Args:
        test_id: Test case ID
        mode: Execution mode ("text" or "image")
        request: Execution request with system prompt and model

    Returns:
        ExecutionResult with accuracy breakdown

    Raises:
        HTTPException: 404 if test case not found
        HTTPException: 400 if mode is invalid or image mode requested without image
        HTTPException: 504 if Claude API times out
        HTTPException: 500 for other errors
    """
    # Validate mode
    if mode not in ("text", "image"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mode '{mode}'. Must be 'text' or 'image'"
        )

    # Load test case
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test case '{test_id}' not found"
        )

    # For image mode, validate image exists
    if mode == "image":
        if not test_case.image_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Test case '{test_id}' has no image for image mode execution"
            )

    # Build metadata
    metadata = {
        "model": request.model,
        "system_prompt": request.system_prompt,
        "timestamp": datetime.utcnow().isoformat(),
        "mode": mode
    }

    try:
        # Execute based on mode
        if mode == "text":
            extracted_lineup = await extract_lineup_from_text(
                festival_name=test_case.name,
                system_prompt=request.system_prompt,
                model=request.model
            )
        else:  # image mode
            image_path = IMAGES_DIR / test_case.image_hash
            extracted_lineup = await extract_lineup_from_image(
                image_path=image_path,
                system_prompt=request.system_prompt,
                model=request.model
            )

        # Calculate accuracy
        accuracy_dict = calculate_accuracy(extracted_lineup, test_case.lineup)
        accuracy_result = AccuracyResult(**accuracy_dict)

        return ExecutionResult(
            test_id=test_id,
            status="success",
            extracted_lineup=extracted_lineup,
            accuracy=accuracy_result,
            error=None,
            metadata=metadata
        )

    except asyncio.TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution failed: {str(e)}"
        )
