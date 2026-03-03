"""REST API endpoints for web search test execution and evaluation."""

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from backend.services import calculate_accuracy, extract_lineup_from_text
from backend.storage import save_result, load_result, load_all_results


router = APIRouter(prefix="/api/web-search/executions", tags=["web-search-executions"])


# Request/Response models for single execution
class WebSearchExecutionRequest(BaseModel):
    """Request body for executing a single web search test."""
    festival_name: str
    year: str
    ground_truth_lineup: List[str]
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


class WebSearchExecutionResult(BaseModel):
    """Result of a single web search test execution."""
    test_id: str
    status: str  # "success" or "failed"
    extracted_lineup: Optional[List[str]] = None
    accuracy: Optional[AccuracyResult] = None
    error: Optional[str] = None
    metadata: dict  # model, system_prompt, timestamp


# Batch execution models
class WebSearchTestInput(BaseModel):
    """Input data for a single test in batch execution."""
    id: str
    festival_name: str
    year: str
    ground_truth_lineup: List[str]


class WebSearchBatchRequest(BaseModel):
    """Request body for batch web search execution."""
    tests: List[WebSearchTestInput]
    system_prompt: str
    model: str


class WebSearchBatchStartResponse(BaseModel):
    """Response when batch execution starts."""
    batch_id: str
    status: str


class WebSearchBatchProgress(BaseModel):
    """Current progress of a batch execution."""
    total: int
    completed: int
    failed: int
    cancelled: bool
    current_test_id: Optional[str] = None


class WebSearchBatchSummary(BaseModel):
    """Summary of completed batch execution."""
    total: int
    completed: int
    failed: int
    perfect_count: int  # 100% accuracy
    average_accuracy: float
    results: List[WebSearchExecutionResult]


# In-memory batch state storage
@dataclass
class WebSearchBatchState:
    """Internal state for tracking batch execution."""
    total: int
    system_prompt: str
    model: str
    completed: int = 0
    failed: int = 0
    cancelled: bool = False
    current_test_id: Optional[str] = None
    results: List[WebSearchExecutionResult] = field(default_factory=list)


web_search_batch_states: Dict[str, WebSearchBatchState] = {}


# =============================================================================
# BATCH ROUTES - Must be defined BEFORE /{test_id} to avoid route conflicts
# =============================================================================

async def run_web_search_batch_execution(
    batch_id: str,
    tests: List[WebSearchTestInput]
) -> None:
    """
    Background task to execute batch web search tests.

    Args:
        batch_id: Unique batch identifier
        tests: List of test inputs to execute
    """
    state = web_search_batch_states.get(batch_id)
    if not state:
        return

    for test in tests:
        # Check if cancelled before each test
        if state.cancelled:
            break

        state.current_test_id = test.id

        # Build metadata
        metadata = {
            "model": state.model,
            "system_prompt": state.system_prompt,
            "timestamp": datetime.utcnow().isoformat(),
            "festival_name": test.festival_name,
            "year": test.year
        }

        try:
            # Build query string for web search
            query = f"{test.festival_name} {test.year}"

            # Call Claude with web search enabled
            extracted_lineup = await extract_lineup_from_text(
                festival_name=query,
                system_prompt=state.system_prompt,
                model=state.model
            )

            # Calculate accuracy
            accuracy_dict = calculate_accuracy(extracted_lineup, test.ground_truth_lineup)
            accuracy_result = AccuracyResult(**accuracy_dict)

            result = WebSearchExecutionResult(
                test_id=test.id,
                status="success",
                extracted_lineup=extracted_lineup,
                accuracy=accuracy_result,
                error=None,
                metadata=metadata
            )
            state.results.append(result)
            save_result(test.id, result.model_dump())
            state.completed += 1

        except Exception as e:
            # Any error - mark as failed but continue
            result = WebSearchExecutionResult(
                test_id=test.id,
                status="failed",
                error=str(e),
                metadata=metadata
            )
            state.results.append(result)
            save_result(test.id, result.model_dump())
            state.failed += 1
            state.completed += 1

    # Clear current test when done
    state.current_test_id = None


@router.post("/batch", response_model=WebSearchBatchStartResponse)
async def start_web_search_batch_execution(
    request: WebSearchBatchRequest,
    background_tasks: BackgroundTasks
) -> WebSearchBatchStartResponse:
    """
    Start a batch execution of multiple web search test cases.

    Runs in the background. Use progress and results endpoints to monitor.

    Args:
        request: Batch execution request with tests, system_prompt, and model
        background_tasks: FastAPI background tasks

    Returns:
        WebSearchBatchStartResponse with batch_id for tracking

    Raises:
        HTTPException: 400 if tests list is empty
    """
    # Validate tests
    if not request.tests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tests cannot be empty"
        )

    # Generate batch ID
    batch_id = str(uuid.uuid4())

    # Initialize batch state
    web_search_batch_states[batch_id] = WebSearchBatchState(
        total=len(request.tests),
        system_prompt=request.system_prompt,
        model=request.model
    )

    # Start background execution
    background_tasks.add_task(run_web_search_batch_execution, batch_id, request.tests)

    return WebSearchBatchStartResponse(batch_id=batch_id, status="started")


@router.get("/batch/{batch_id}/progress", response_model=WebSearchBatchProgress)
async def get_web_search_batch_progress(batch_id: str) -> WebSearchBatchProgress:
    """
    Get current progress of a web search batch execution.

    Args:
        batch_id: Batch execution ID

    Returns:
        WebSearchBatchProgress with current state

    Raises:
        HTTPException: 404 if batch not found
    """
    state = web_search_batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    return WebSearchBatchProgress(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        cancelled=state.cancelled,
        current_test_id=state.current_test_id
    )


@router.post("/batch/{batch_id}/cancel", response_model=WebSearchBatchProgress)
async def cancel_web_search_batch_execution(batch_id: str) -> WebSearchBatchProgress:
    """
    Cancel a running web search batch execution.

    Sets cancelled flag which stops processing after current test.
    Partial results are preserved.

    Args:
        batch_id: Batch execution ID

    Returns:
        WebSearchBatchProgress with updated state

    Raises:
        HTTPException: 404 if batch not found
    """
    state = web_search_batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    state.cancelled = True

    return WebSearchBatchProgress(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        cancelled=state.cancelled,
        current_test_id=state.current_test_id
    )


@router.get("/batch/{batch_id}/results", response_model=WebSearchBatchSummary)
async def get_web_search_batch_results(batch_id: str) -> WebSearchBatchSummary:
    """
    Get results of a web search batch execution.

    Includes summary statistics and all individual results.

    Args:
        batch_id: Batch execution ID

    Returns:
        WebSearchBatchSummary with all results and statistics

    Raises:
        HTTPException: 404 if batch not found
    """
    state = web_search_batch_states.get(batch_id)
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

    return WebSearchBatchSummary(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        perfect_count=perfect_count,
        average_accuracy=round(average_accuracy, 2),
        results=state.results
    )


# =============================================================================
# SINGLE TEST ROUTE - Must be AFTER batch routes due to /{test_id} pattern
# =============================================================================

@router.post("/{test_id}", response_model=WebSearchExecutionResult)
async def execute_web_search_test(
    test_id: str,
    request: WebSearchExecutionRequest
) -> WebSearchExecutionResult:
    """
    Execute a single web search test case against Claude.

    Args:
        test_id: Test case ID
        request: Execution request with festival data, system prompt, and model

    Returns:
        WebSearchExecutionResult with accuracy breakdown

    Raises:
        HTTPException: 504 if Claude API times out
        HTTPException: 500 for other errors
    """
    # Build metadata
    metadata = {
        "model": request.model,
        "system_prompt": request.system_prompt,
        "timestamp": datetime.utcnow().isoformat(),
        "festival_name": request.festival_name,
        "year": request.year
    }

    try:
        # Build query string for web search
        query = f"{request.festival_name} {request.year}"

        # Call Claude with web search enabled
        extracted_lineup = await extract_lineup_from_text(
            festival_name=query,
            system_prompt=request.system_prompt,
            model=request.model
        )

        # Calculate accuracy
        accuracy_dict = calculate_accuracy(extracted_lineup, request.ground_truth_lineup)
        accuracy_result = AccuracyResult(**accuracy_dict)

        result = WebSearchExecutionResult(
            test_id=test_id,
            status="success",
            extracted_lineup=extracted_lineup,
            accuracy=accuracy_result,
            error=None,
            metadata=metadata
        )
        save_result(test_id, result.model_dump())
        return result

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
