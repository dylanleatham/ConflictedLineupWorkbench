"""Web Search Eval workspace: find a lineup from the festival name via web search."""

from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from backend.api.evaluation import (
    BatchStartResponse,
    EvaluationWorkspace,
    LineupBatchSummary,
    LineupExecutionResult,
    SafeId,
    SafeIdPath,
    summarize_lineup_results,
)
from backend.services import calculate_accuracy, extract_lineup_from_text

router = APIRouter(prefix="/api/web-search/executions", tags=["web-search-executions"])


class WebSearchTest(BaseModel):
    """What a web search test needs."""
    festival_name: str
    year: str
    ground_truth_lineup: List[str]


class WebSearchExecutionRequest(WebSearchTest):
    """Request body for executing a single web search test."""
    system_prompt: str
    model: str


class WebSearchTestInput(WebSearchTest):
    """One test in a batch request."""
    id: SafeId


class WebSearchBatchRequest(BaseModel):
    """Request body for batch web search execution."""
    tests: List[WebSearchTestInput]
    system_prompt: str
    model: str


async def evaluate(test: WebSearchTest, system_prompt: str, model: str, record: Dict[str, Any]) -> None:
    """Ask Claude (with web search) for the lineup and score it."""
    record["extracted_lineup"] = await extract_lineup_from_text(
        festival_name=f"{test.festival_name} {test.year}", system_prompt=system_prompt, model=model
    )
    record["accuracy"] = calculate_accuracy(record["extracted_lineup"], test.ground_truth_lineup)


workspace = EvaluationWorkspace(
    name="web-search",
    result_model=LineupExecutionResult,
    summary_model=LineupBatchSummary,
    evaluate=evaluate,
    summarize=summarize_lineup_results,
    describe=lambda test: {"festival_name": test.festival_name, "year": test.year},
)


# POST /batch must be registered before POST /{test_id}, which would match it
@router.post("/batch", response_model=BatchStartResponse)
async def start_web_search_batch_execution(
    request: WebSearchBatchRequest, background_tasks: BackgroundTasks
) -> BatchStartResponse:
    """Start running tests in the background; poll /batch/{id}/progress."""
    return workspace.start_batch(
        [(test.id, test) for test in request.tests],
        request.system_prompt, request.model, background_tasks,
    )


@router.post("/{test_id}", response_model=LineupExecutionResult)
async def execute_web_search_test(request: WebSearchExecutionRequest, test_id: SafeIdPath):
    """Run one test. Execution failures come back as status "failed"."""
    return await workspace.run(test_id, request, request.system_prompt, request.model)


workspace.add_routes(router)
