"""REST API endpoints for poster search test execution and evaluation."""

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from backend.services import extract_poster_url, download_image, compute_image_similarity
from backend.storage import get_image_path, save_result, load_result, load_all_results


router = APIRouter(prefix="/api/poster-search/executions", tags=["poster-search-executions"])


# Request/Response models
class PosterSearchExecutionRequest(BaseModel):
    """Request body for executing a single poster search test."""
    festival_name: str
    year: str
    image_hash: str
    system_prompt: str
    model: str


class SimilarityResult(BaseModel):
    """Image similarity calculation result."""
    similarity_percentage: float
    ssim_raw: float
    method: str


class PosterSearchExecutionResult(BaseModel):
    """Result of a single poster search test execution."""
    test_id: str
    status: str  # "success" or "failed"
    poster_url: Optional[str] = None
    similarity: Optional[SimilarityResult] = None
    error: Optional[str] = None
    metadata: dict


# Batch execution models
class PosterSearchTestInput(BaseModel):
    """Input data for a single test in batch execution."""
    id: str
    festival_name: str
    year: str
    image_hash: str


class PosterSearchBatchRequest(BaseModel):
    """Request body for batch poster search execution."""
    tests: List[PosterSearchTestInput]
    system_prompt: str
    model: str


class PosterSearchBatchStartResponse(BaseModel):
    """Response when batch execution starts."""
    batch_id: str
    status: str


class PosterSearchBatchProgress(BaseModel):
    """Current progress of a batch execution."""
    total: int
    completed: int
    failed: int
    cancelled: bool
    current_test_id: Optional[str] = None


class PosterSearchBatchSummary(BaseModel):
    """Summary of completed batch execution."""
    total: int
    completed: int
    failed: int
    high_similarity_count: int  # >80% similarity
    average_similarity: float
    results: List[PosterSearchExecutionResult]


# In-memory batch state storage
@dataclass
class PosterSearchBatchState:
    """Internal state for tracking batch execution."""
    total: int
    system_prompt: str
    model: str
    completed: int = 0
    failed: int = 0
    cancelled: bool = False
    current_test_id: Optional[str] = None
    results: List[PosterSearchExecutionResult] = field(default_factory=list)


poster_search_batch_states: Dict[str, PosterSearchBatchState] = {}


# =============================================================================
# BATCH ROUTES - Must be defined BEFORE /{test_id} to avoid route conflicts
# =============================================================================

async def run_poster_search_batch_execution(
    batch_id: str,
    tests: List[PosterSearchTestInput]
) -> None:
    """Background task to execute batch poster search tests."""
    state = poster_search_batch_states.get(batch_id)
    if not state:
        return

    for i, test in enumerate(tests):
        if state.cancelled:
            break

        # Delay between API calls to avoid rate limits (skip before first)
        if i > 0:
            await asyncio.sleep(10)

        state.current_test_id = test.id

        metadata = {
            "model": state.model,
            "system_prompt": state.system_prompt,
            "timestamp": datetime.utcnow().isoformat(),
            "festival_name": test.festival_name,
            "year": test.year
        }

        poster_url = None
        try:
            query = f"{test.festival_name} {test.year}"

            # Get poster URL from Claude
            poster_url = await extract_poster_url(
                festival_name=query,
                system_prompt=state.system_prompt,
                model=state.model
            )

            # Download the image
            image_bytes = await download_image(poster_url)

            # Get ground truth image path
            gt_path = get_image_path(test.image_hash)
            if not gt_path.exists():
                raise FileNotFoundError(f"Ground truth image not found: {test.image_hash}")

            # Compare images
            similarity_dict = compute_image_similarity(gt_path, image_bytes)
            similarity_result = SimilarityResult(**similarity_dict)

            result = PosterSearchExecutionResult(
                test_id=test.id,
                status="success",
                poster_url=poster_url,
                similarity=similarity_result,
                error=None,
                metadata=metadata
            )
            state.results.append(result)
            save_result(test.id, result.model_dump(), workspace="poster-search")
            state.completed += 1

        except Exception as e:
            result = PosterSearchExecutionResult(
                test_id=test.id,
                status="failed",
                poster_url=poster_url,
                error=str(e),
                metadata=metadata
            )
            state.results.append(result)
            save_result(test.id, result.model_dump(), workspace="poster-search")
            state.failed += 1
            state.completed += 1

    state.current_test_id = None


@router.post("/batch", response_model=PosterSearchBatchStartResponse)
async def start_poster_search_batch_execution(
    request: PosterSearchBatchRequest,
    background_tasks: BackgroundTasks
) -> PosterSearchBatchStartResponse:
    """Start a batch execution of multiple poster search test cases."""
    if not request.tests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tests cannot be empty"
        )

    batch_id = str(uuid.uuid4())

    poster_search_batch_states[batch_id] = PosterSearchBatchState(
        total=len(request.tests),
        system_prompt=request.system_prompt,
        model=request.model
    )

    background_tasks.add_task(run_poster_search_batch_execution, batch_id, request.tests)

    return PosterSearchBatchStartResponse(batch_id=batch_id, status="started")


@router.get("/batch/{batch_id}/progress", response_model=PosterSearchBatchProgress)
async def get_poster_search_batch_progress(batch_id: str) -> PosterSearchBatchProgress:
    """Get current progress of a poster search batch execution."""
    state = poster_search_batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    return PosterSearchBatchProgress(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        cancelled=state.cancelled,
        current_test_id=state.current_test_id
    )


@router.post("/batch/{batch_id}/cancel", response_model=PosterSearchBatchProgress)
async def cancel_poster_search_batch_execution(batch_id: str) -> PosterSearchBatchProgress:
    """Cancel a running poster search batch execution."""
    state = poster_search_batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    state.cancelled = True

    return PosterSearchBatchProgress(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        cancelled=state.cancelled,
        current_test_id=state.current_test_id
    )


@router.get("/batch/{batch_id}/results", response_model=PosterSearchBatchSummary)
async def get_poster_search_batch_results(batch_id: str) -> PosterSearchBatchSummary:
    """Get results of a poster search batch execution."""
    state = poster_search_batch_states.get(batch_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_id}' not found"
        )

    high_similarity_count = 0
    total_similarity = 0.0
    similarity_count = 0

    for result in state.results:
        if result.status == "success" and result.similarity:
            similarity_count += 1
            total_similarity += result.similarity.similarity_percentage
            if result.similarity.similarity_percentage >= 80.0:
                high_similarity_count += 1

    average_similarity = total_similarity / similarity_count if similarity_count > 0 else 0.0

    return PosterSearchBatchSummary(
        total=state.total,
        completed=state.completed,
        failed=state.failed,
        high_similarity_count=high_similarity_count,
        average_similarity=round(average_similarity, 2),
        results=state.results
    )


# =============================================================================
# SINGLE TEST ROUTE - Must be AFTER batch routes due to /{test_id} pattern
# =============================================================================

@router.post("/{test_id}", response_model=PosterSearchExecutionResult)
async def execute_poster_search_test(
    test_id: str,
    request: PosterSearchExecutionRequest
) -> PosterSearchExecutionResult:
    """Execute a single poster search test case."""
    metadata = {
        "model": request.model,
        "system_prompt": request.system_prompt,
        "timestamp": datetime.utcnow().isoformat(),
        "festival_name": request.festival_name,
        "year": request.year
    }

    poster_url = None
    try:
        query = f"{request.festival_name} {request.year}"

        poster_url = await extract_poster_url(
            festival_name=query,
            system_prompt=request.system_prompt,
            model=request.model
        )

        image_bytes = await download_image(poster_url)

        gt_path = get_image_path(request.image_hash)
        if not gt_path.exists():
            raise FileNotFoundError(f"Ground truth image not found: {request.image_hash}")

        similarity_dict = compute_image_similarity(gt_path, image_bytes)
        similarity_result = SimilarityResult(**similarity_dict)

        result = PosterSearchExecutionResult(
            test_id=test_id,
            status="success",
            poster_url=poster_url,
            similarity=similarity_result,
            error=None,
            metadata=metadata
        )
        save_result(test_id, result.model_dump(), workspace="poster-search")
        return result

    except Exception as e:
        result = PosterSearchExecutionResult(
            test_id=test_id,
            status="failed",
            poster_url=poster_url,
            error=str(e),
            metadata=metadata
        )
        save_result(test_id, result.model_dump(), workspace="poster-search")
        return result


@router.get("/results/{test_id}")
async def get_poster_search_last_result(test_id: str):
    """Get the last saved poster search execution result for a test case."""
    result = load_result(test_id, workspace="poster-search")
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No saved result for test case '{test_id}'"
        )
    return result


@router.get("/results", response_model=dict)
async def get_all_poster_search_results():
    """Get all saved poster search execution results, keyed by test_id."""
    return load_all_results(workspace="poster-search")
