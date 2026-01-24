"""REST API endpoints for test execution and evaluation."""

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
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


# Batch execution models
class BatchRequest(BaseModel):
    """Request body for batch execution."""
    test_ids: List[str]
    mode: str  # "text" or "image"
    system_prompt: str
    model: str


class BatchStartResponse(BaseModel):
    """Response when batch execution starts."""
    batch_id: str
    status: str


class BatchProgress(BaseModel):
    """Current progress of a batch execution."""
    total: int
    completed: int
    failed: int
    cancelled: bool
    current_test_id: Optional[str] = None


class BatchSummary(BaseModel):
    """Summary of completed batch execution."""
    total: int
    completed: int
    failed: int
    perfect_count: int  # 100% accuracy
    average_accuracy: float
    results: List[ExecutionResult]


# In-memory batch state storage
@dataclass
class BatchState:
    """Internal state for tracking batch execution."""
    total: int
    mode: str
    system_prompt: str
    model: str
    completed: int = 0
    failed: int = 0
    cancelled: bool = False
    current_test_id: Optional[str] = None
    results: List[ExecutionResult] = field(default_factory=list)


batch_states: Dict[str, BatchState] = {}


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


async def run_batch_execution(batch_id: str, test_ids: List[str]) -> None:
    """
    Background task to execute batch tests.

    Args:
        batch_id: Unique batch identifier
        test_ids: List of test case IDs to execute
    """
    state = batch_states.get(batch_id)
    if not state:
        return

    for test_id in test_ids:
        # Check if cancelled before each test
        if state.cancelled:
            break

        state.current_test_id = test_id

        # Load test case
        test_case = load_test_case(test_id)
        if not test_case:
            # Test case not found - mark as failed
            state.results.append(ExecutionResult(
                test_id=test_id,
                status="failed",
                error=f"Test case '{test_id}' not found",
                metadata={
                    "model": state.model,
                    "system_prompt": state.system_prompt,
                    "timestamp": datetime.utcnow().isoformat(),
                    "mode": state.mode
                }
            ))
            state.failed += 1
            state.completed += 1
            continue

        # Check for image mode without image
        if state.mode == "image" and not test_case.image_hash:
            state.results.append(ExecutionResult(
                test_id=test_id,
                status="failed",
                error=f"Test case '{test_id}' has no image for image mode",
                metadata={
                    "model": state.model,
                    "system_prompt": state.system_prompt,
                    "timestamp": datetime.utcnow().isoformat(),
                    "mode": state.mode
                }
            ))
            state.failed += 1
            state.completed += 1
            continue

        # Build metadata
        metadata = {
            "model": state.model,
            "system_prompt": state.system_prompt,
            "timestamp": datetime.utcnow().isoformat(),
            "mode": state.mode
        }

        try:
            # Execute based on mode
            if state.mode == "text":
                extracted_lineup = await extract_lineup_from_text(
                    festival_name=test_case.name,
                    system_prompt=state.system_prompt,
                    model=state.model
                )
            else:  # image mode
                image_path = IMAGES_DIR / test_case.image_hash
                extracted_lineup = await extract_lineup_from_image(
                    image_path=image_path,
                    system_prompt=state.system_prompt,
                    model=state.model
                )

            # Calculate accuracy
            accuracy_dict = calculate_accuracy(extracted_lineup, test_case.lineup)
            accuracy_result = AccuracyResult(**accuracy_dict)

            state.results.append(ExecutionResult(
                test_id=test_id,
                status="success",
                extracted_lineup=extracted_lineup,
                accuracy=accuracy_result,
                error=None,
                metadata=metadata
            ))
            state.completed += 1

        except Exception as e:
            # Any error - mark as failed but continue
            state.results.append(ExecutionResult(
                test_id=test_id,
                status="failed",
                error=str(e),
                metadata=metadata
            ))
            state.failed += 1
            state.completed += 1

    # Clear current test when done
    state.current_test_id = None


@router.post("/batch", response_model=BatchStartResponse)
async def start_batch_execution(
    request: BatchRequest,
    background_tasks: BackgroundTasks
) -> BatchStartResponse:
    """
    Start a batch execution of multiple test cases.

    Runs in the background. Use progress and results endpoints to monitor.

    Args:
        request: Batch execution request
        background_tasks: FastAPI background tasks

    Returns:
        BatchStartResponse with batch_id for tracking

    Raises:
        HTTPException: 400 if mode is invalid or test_ids is empty
    """
    # Validate mode
    if request.mode not in ("text", "image"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mode '{request.mode}'. Must be 'text' or 'image'"
        )

    # Validate test_ids
    if not request.test_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="test_ids cannot be empty"
        )

    # Generate batch ID
    batch_id = str(uuid.uuid4())

    # Initialize batch state
    batch_states[batch_id] = BatchState(
        total=len(request.test_ids),
        mode=request.mode,
        system_prompt=request.system_prompt,
        model=request.model
    )

    # Start background execution
    background_tasks.add_task(run_batch_execution, batch_id, request.test_ids)

    return BatchStartResponse(batch_id=batch_id, status="started")


@router.get("/batch/{batch_id}/progress", response_model=BatchProgress)
async def get_batch_progress(batch_id: str) -> BatchProgress:
    """
    Get current progress of a batch execution.

    Args:
        batch_id: Batch execution ID

    Returns:
        BatchProgress with current state

    Raises:
        HTTPException: 404 if batch not found
    """
    state = batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    return BatchProgress(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        cancelled=state.cancelled,
        current_test_id=state.current_test_id
    )


@router.post("/batch/{batch_id}/cancel", response_model=BatchProgress)
async def cancel_batch_execution(batch_id: str) -> BatchProgress:
    """
    Cancel a running batch execution.

    Sets cancelled flag which stops processing after current test.
    Partial results are preserved.

    Args:
        batch_id: Batch execution ID

    Returns:
        BatchProgress with updated state

    Raises:
        HTTPException: 404 if batch not found
    """
    state = batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    state.cancelled = True

    return BatchProgress(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        cancelled=state.cancelled,
        current_test_id=state.current_test_id
    )


@router.get("/batch/{batch_id}/results", response_model=BatchSummary)
async def get_batch_results(batch_id: str) -> BatchSummary:
    """
    Get results of a batch execution.

    Includes summary statistics and all individual results.

    Args:
        batch_id: Batch execution ID

    Returns:
        BatchSummary with all results and statistics

    Raises:
        HTTPException: 404 if batch not found
    """
    state = batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    # Calculate summary statistics
    perfect_count = 0
    total_accuracy = 0.0
    accuracy_count = 0

    for result in state.results:
        if result.status == "success" and result.accuracy:
            accuracy_count += 1
            total_accuracy += result.accuracy.accuracy_percentage
            if result.accuracy.accuracy_percentage == 100.0:
                perfect_count += 1

    average_accuracy = total_accuracy / accuracy_count if accuracy_count > 0 else 0.0

    return BatchSummary(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        perfect_count=perfect_count,
        average_accuracy=round(average_accuracy, 2),
        results=state.results
    )
