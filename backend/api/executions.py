"""Image Eval workspace: extract a lineup from a stored poster image."""

from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from backend.api.evaluation import (
    BatchStartResponse,
    EvaluationWorkspace,
    LineupBatchSummary,
    LineupExecutionResult,
    SafeId,
    summarize_lineup_results,
)
from backend.services import calculate_accuracy, extract_lineup_from_image
from backend.storage import get_image_path, load_test_case

router = APIRouter(prefix="/api/executions", tags=["executions"])


class ExecutionRequest(BaseModel):
    """Request body for executing a test."""
    system_prompt: str
    model: str


class BatchRequest(BaseModel):
    """Request body for batch execution."""
    test_ids: List[SafeId]
    system_prompt: str
    model: str


async def evaluate(test_id: str, system_prompt: str, model: str, record: Dict[str, Any]) -> None:
    """Run the stored test case's poster through Claude and score the lineup."""
    test_case = load_test_case(test_id)
    if not test_case:
        raise LookupError(f"Test case '{test_id}' not found")
    image_path = get_image_path(test_case.image_hash) if test_case.image_hash else None
    if not image_path:
        raise FileNotFoundError(f"Test case '{test_id}' has no image")

    record["extracted_lineup"] = await extract_lineup_from_image(
        image_path=image_path, system_prompt=system_prompt, model=model
    )
    record["accuracy"] = calculate_accuracy(record["extracted_lineup"], test_case.lineup)


workspace = EvaluationWorkspace(
    name="image-eval",
    result_model=LineupExecutionResult,
    summary_model=LineupBatchSummary,
    evaluate=evaluate,
    summarize=summarize_lineup_results,
)


# POST /batch must be registered before POST /{test_id}, which would match it
@router.post("/batch", response_model=BatchStartResponse)
async def start_batch_execution(request: BatchRequest, background_tasks: BackgroundTasks) -> BatchStartResponse:
    """Start running stored test cases in the background; poll /batch/{id}/progress."""
    return workspace.start_batch(
        [(test_id, test_id) for test_id in request.test_ids],
        request.system_prompt, request.model, background_tasks,
    )


@router.post("/{test_id}", response_model=LineupExecutionResult)
async def execute_test(test_id: str, request: ExecutionRequest):
    """Run one stored test case. Execution failures come back as status "failed"."""
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Test case '{test_id}' not found")
    if not test_case.image_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Test case '{test_id}' has no image")
    return await workspace.run(test_id, test_id, request.system_prompt, request.model)


workspace.add_routes(router)
