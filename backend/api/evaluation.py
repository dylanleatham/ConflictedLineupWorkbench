"""
Shared execution machinery for the evaluation workspaces.

Each workspace (image eval, web search, poster search) supplies how to
evaluate one test and how to summarize a batch; this module handles the
rest: result metadata, persistence, background batches with progress and
cancellation, and the routes for polling batches and reading saved results.
"""

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Annotated, Any, Awaitable, Callable, Dict, List, Optional, Tuple, Type

from fastapi import APIRouter, BackgroundTasks, HTTPException, Path, status
from pydantic import BaseModel, StringConstraints

from backend.storage import load_all_results, load_result, save_result

logger = logging.getLogger(__name__)

# Pause between tests in a batch to stay under tokens-per-minute limits
BATCH_DELAY_SECONDS = 10.0

# Test IDs become result filenames, so constrain them at the API boundary
SAFE_ID_PATTERN = r"^[A-Za-z0-9_-]{1,128}$"
SafeId = Annotated[str, StringConstraints(pattern=SAFE_ID_PATTERN)]  # in request bodies
SafeIdPath = Annotated[str, Path(pattern=SAFE_ID_PATTERN)]  # as a path parameter

# evaluate(test, system_prompt, model, record) fills `record` with result
# fields as it goes, so a failure part-way still reports what was produced.
EvaluateFn = Callable[[Any, str, str, Dict[str, Any]], Awaitable[None]]


class BatchStartResponse(BaseModel):
    """Response when batch execution starts."""
    batch_id: str
    status: str


class BatchProgress(BaseModel):
    """Current progress of a batch execution."""
    total: int
    completed: int  # includes failed tests
    failed: int
    cancelled: bool
    current_test_id: Optional[str] = None


@dataclass
class BatchState:
    """Internal state for tracking a batch execution."""
    total: int
    system_prompt: str
    model: str
    completed: int = 0
    failed: int = 0
    cancelled: bool = False
    current_test_id: Optional[str] = None
    results: List[BaseModel] = field(default_factory=list)

    def progress(self) -> BatchProgress:
        return BatchProgress(
            total=self.total,
            completed=self.completed,
            failed=self.failed,
            cancelled=self.cancelled,
            current_test_id=self.current_test_id,
        )


class EvaluationWorkspace:
    """Runs tests for one workspace and serves its batch and result routes."""

    def __init__(
        self,
        *,
        name: str,
        result_model: Type[BaseModel],
        summary_model: Type[BaseModel],
        evaluate: EvaluateFn,
        summarize: Callable[[List[BaseModel]], Dict[str, Any]],
        describe: Callable[[Any], Dict[str, Any]] = lambda test: {},
    ):
        """
        Args:
            name: Storage namespace for saved results
            result_model: Model for one test result; must accept test_id,
                status, error, metadata plus the fields `evaluate` records
            summary_model: Model for batch results; must accept total,
                completed, failed, results plus the fields from `summarize`
            evaluate: Runs one test, raising on failure
            summarize: Computes workspace-specific stats from batch results
            describe: Extra metadata to record for a test
        """
        self.name = name
        self.result_model = result_model
        self.summary_model = summary_model
        self.evaluate = evaluate
        self.summarize = summarize
        self.describe = describe
        self.batch_delay = BATCH_DELAY_SECONDS
        self.batches: Dict[str, BatchState] = {}

    async def run(self, test_id: str, test: Any, system_prompt: str, model: str) -> BaseModel:
        """Evaluate one test, save the result, and return it (failed or not)."""
        metadata = {
            "model": model,
            "system_prompt": system_prompt,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **self.describe(test),
        }
        record: Dict[str, Any] = {}
        try:
            await self.evaluate(test, system_prompt, model, record)
            result = self.result_model(
                test_id=test_id, status="success", metadata=metadata, **record
            )
        except Exception as e:
            logger.warning(f"[{self.name}] test '{test_id}' failed: {e}")
            result = self.result_model(
                test_id=test_id, status="failed", error=str(e) or type(e).__name__,
                metadata=metadata, **record,
            )

        try:
            save_result(test_id, result.model_dump(), workspace=self.name)
        except (OSError, ValueError) as e:
            logger.error(f"[{self.name}] could not save result for '{test_id}': {e}")
        return result

    def start_batch(
        self,
        tests: List[Tuple[str, Any]],
        system_prompt: str,
        model: str,
        background_tasks: BackgroundTasks,
    ) -> BatchStartResponse:
        """Queue (test_id, test) pairs to run in the background."""
        if not tests:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No tests to run"
            )
        batch_id = str(uuid.uuid4())
        state = BatchState(total=len(tests), system_prompt=system_prompt, model=model)
        self.batches[batch_id] = state
        background_tasks.add_task(self._run_batch, state, tests)
        return BatchStartResponse(batch_id=batch_id, status="started")

    async def _run_batch(self, state: BatchState, tests: List[Tuple[str, Any]]) -> None:
        for i, (test_id, test) in enumerate(tests):
            if i > 0:
                await asyncio.sleep(self.batch_delay)
            # Check after the pause so a cancel during it takes effect immediately
            if state.cancelled:
                break

            state.current_test_id = test_id
            result = await self.run(test_id, test, state.system_prompt, state.model)
            state.results.append(result)
            state.completed += 1
            if result.status == "failed":
                state.failed += 1

        state.current_test_id = None

    def _get_batch(self, batch_id: str) -> BatchState:
        state = self.batches.get(batch_id)
        if not state:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Batch '{batch_id}' not found"
            )
        return state

    def add_routes(self, router: APIRouter) -> None:
        """Register batch polling/cancel/results and saved-result routes."""
        summary_model = self.summary_model

        @router.get("/batch/{batch_id}/progress", response_model=BatchProgress)
        async def get_batch_progress(batch_id: str) -> BatchProgress:
            """Get current progress of a batch execution."""
            return self._get_batch(batch_id).progress()

        @router.post("/batch/{batch_id}/cancel", response_model=BatchProgress)
        async def cancel_batch(batch_id: str) -> BatchProgress:
            """Stop a batch after the current test; completed results are kept."""
            state = self._get_batch(batch_id)
            state.cancelled = True
            return state.progress()

        @router.get("/batch/{batch_id}/results", response_model=summary_model)
        async def get_batch_results(batch_id: str):
            """Get summary statistics and all individual results for a batch."""
            state = self._get_batch(batch_id)
            return summary_model(
                total=state.total,
                completed=state.completed,
                failed=state.failed,
                results=state.results,
                **self.summarize(state.results),
            )

        @router.get("/results/{test_id}")
        async def get_last_result(test_id: str) -> dict:
            """Get the last saved result for a test case."""
            result = load_result(test_id, workspace=self.name)
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No saved result for test case '{test_id}'",
                )
            return result

        @router.get("/results", response_model=dict)
        async def get_all_results() -> dict:
            """Get all saved results, keyed by test_id."""
            return load_all_results(workspace=self.name)


# --- Shared result models for the lineup-extraction workspaces ---------------

class AccuracyResult(BaseModel):
    """Accuracy calculation result."""
    total_ground_truth: int
    total_extracted: int
    matched: int
    accuracy_percentage: float
    missed: List[str]
    extra: List[str]
    matched_artists: List[str]


class LineupExecutionResult(BaseModel):
    """Result of a single lineup extraction test."""
    test_id: str
    status: str  # "success" or "failed"
    extracted_lineup: Optional[List[str]] = None
    accuracy: Optional[AccuracyResult] = None
    error: Optional[str] = None
    metadata: dict  # model, system_prompt, timestamp, and workspace extras


class LineupBatchSummary(BaseModel):
    """Summary of a completed lineup extraction batch."""
    total: int
    completed: int
    failed: int
    perfect_count: int  # 100% accuracy
    average_accuracy: float
    results: List[LineupExecutionResult]


def summarize_lineup_results(results: List[LineupExecutionResult]) -> Dict[str, Any]:
    """Average accuracy and perfect-score count over successful results."""
    scores = [r.accuracy.accuracy_percentage for r in results if r.status == "success" and r.accuracy]
    return {
        "perfect_count": sum(1 for s in scores if s == 100.0),
        "average_accuracy": round(sum(scores) / len(scores), 2) if scores else 0.0,
    }
