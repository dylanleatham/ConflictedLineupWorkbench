"""Poster Search workspace: have Claude find the official poster, then compare it to ours."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from backend.api.evaluation import BatchStartResponse, EvaluationWorkspace, SafeId, SafeIdPath
from backend.services import compute_image_similarity, download_image, extract_poster_url
from backend.storage import get_image_path

router = APIRouter(prefix="/api/poster-search/executions", tags=["poster-search-executions"])

HIGH_SIMILARITY_THRESHOLD = 80.0  # percent


class PosterSearchTest(BaseModel):
    """What a poster search test needs."""
    festival_name: str
    year: str
    image_hash: str


class PosterSearchExecutionRequest(PosterSearchTest):
    """Request body for executing a single poster search test."""
    system_prompt: str
    model: str


class PosterSearchTestInput(PosterSearchTest):
    """One test in a batch request."""
    id: SafeId


class PosterSearchBatchRequest(BaseModel):
    """Request body for batch poster search execution."""
    tests: List[PosterSearchTestInput]
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
    claude_response: Optional[dict] = None  # Full JSON: {poster_url, source_url, lineup_text}
    similarity: Optional[SimilarityResult] = None
    error: Optional[str] = None
    metadata: dict


class PosterSearchBatchSummary(BaseModel):
    """Summary of completed batch execution."""
    total: int
    completed: int
    failed: int
    high_similarity_count: int  # >= HIGH_SIMILARITY_THRESHOLD
    average_similarity: float
    results: List[PosterSearchExecutionResult]


async def evaluate(test: PosterSearchTest, system_prompt: str, model: str, record: Dict[str, Any]) -> None:
    """Ask Claude for the poster URL, download it, and score it against ours with SSIM."""
    gt_path = get_image_path(test.image_hash)
    if gt_path is None:
        raise FileNotFoundError(f"Ground truth image not found: {test.image_hash}")

    record["claude_response"] = await extract_poster_url(
        festival_name=f"{test.festival_name} {test.year}", system_prompt=system_prompt, model=model
    )
    record["poster_url"] = record["claude_response"].get("poster_url")
    if not record["poster_url"]:
        raise ValueError("Claude response missing poster_url field")

    image_bytes = await download_image(record["poster_url"])
    record["similarity"] = compute_image_similarity(gt_path, image_bytes)


def summarize(results: List[PosterSearchExecutionResult]) -> Dict[str, Any]:
    """Average similarity and count of close matches over successful results."""
    scores = [r.similarity.similarity_percentage for r in results if r.status == "success" and r.similarity]
    return {
        "high_similarity_count": sum(1 for s in scores if s >= HIGH_SIMILARITY_THRESHOLD),
        "average_similarity": round(sum(scores) / len(scores), 2) if scores else 0.0,
    }


workspace = EvaluationWorkspace(
    name="poster-search",
    result_model=PosterSearchExecutionResult,
    summary_model=PosterSearchBatchSummary,
    evaluate=evaluate,
    summarize=summarize,
    describe=lambda test: {"festival_name": test.festival_name, "year": test.year},
)


# POST /batch must be registered before POST /{test_id}, which would match it
@router.post("/batch", response_model=BatchStartResponse)
async def start_poster_search_batch_execution(
    request: PosterSearchBatchRequest, background_tasks: BackgroundTasks
) -> BatchStartResponse:
    """Start running tests in the background; poll /batch/{id}/progress."""
    return workspace.start_batch(
        [(test.id, test) for test in request.tests],
        request.system_prompt, request.model, background_tasks,
    )


@router.post("/{test_id}", response_model=PosterSearchExecutionResult)
async def execute_poster_search_test(request: PosterSearchExecutionRequest, test_id: SafeIdPath):
    """Run one test. Execution failures come back as status "failed"."""
    return await workspace.run(test_id, request, request.system_prompt, request.model)


workspace.add_routes(router)
