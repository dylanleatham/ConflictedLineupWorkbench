# Phase 3: Execution & Evaluation - Research

**Researched:** 2026-01-23
**Domain:** Claude API integration, async execution, accuracy evaluation
**Confidence:** HIGH

## Summary

This phase integrates the Anthropic Claude API with the existing FastAPI backend and React frontend to execute lineup extraction tests and measure accuracy. The research reveals a well-established stack: Anthropic's official Python SDK for API calls, FastAPI's built-in async support for handling requests, and React's modern hooks for progress tracking and state management.

The key technical challenges are: (1) handling Claude API timeouts and rate limits gracefully during batch execution, (2) tracking progress of async batch operations through the frontend, and (3) implementing accurate string matching for lineup comparison. All three have standard solutions in the ecosystem.

**Primary recommendation:** Use Anthropic Python SDK with built-in retry logic, implement in-memory result storage with optional JSON persistence, and leverage React's automatic batching for smooth progress updates.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| anthropic | latest (0.40+) | Claude API client | Official SDK with automatic retries, error handling, and async support |
| httpx | bundled with anthropic | HTTP client | Used internally by Anthropic SDK for async requests with timeout support |
| asyncio | Python stdlib | Async orchestration | Standard for concurrent operations and timeout handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| thefuzz (RapidFuzz) | latest | Fuzzy string matching | If upgrading from strict matching to fuzzy (out of scope but good to know) |
| pydantic | 2.0+ (already installed) | Request/response models | Already used in codebase for type safety |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory results | JSON file persistence | Files add complexity but enable result history |
| Direct API calls | openai library with custom prompts | Anthropic SDK is purpose-built for Claude |
| Custom retry logic | SDK's built-in retries | Built-in handles exponential backoff correctly |

**Installation:**
```bash
# Backend
cd backend
pip install anthropic

# Add to requirements.txt:
anthropic>=0.40.0
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── api/
│   ├── executions.py     # New: execution endpoints
│   └── evaluations.py    # New: evaluation endpoints (or combined)
├── services/
│   ├── claude.py         # Claude API integration
│   └── evaluator.py      # Accuracy calculation logic
└── storage/
    └── results.py        # Result persistence (optional)

frontend/src/
├── api/
│   └── executions.js     # Execution API client
├── components/
│   ├── ExecutionProgress.jsx    # Progress bar component
│   └── BatchResultsModal.jsx    # Results modal overlay
└── hooks/
    └── useExecution.js   # Execution state management
```

### Pattern 1: Claude API Integration with Vision
**What:** Send festival images to Claude API for lineup extraction
**When to use:** Both individual and batch test execution
**Example:**
```python
# Source: https://platform.claude.com/docs/en/api/messages
from anthropic import Anthropic
import base64

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Read image and encode to base64
with open(image_path, "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

# Send request with image
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",  # or png, gif, webp
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": system_prompt  # From PromptConfig
                }
            ],
        }
    ],
)
```

### Pattern 2: Async Execution with Timeout
**What:** Execute Claude API calls with configurable timeout
**When to use:** All API calls to prevent hanging
**Example:**
```python
# Source: Multiple FastAPI timeout patterns
import asyncio
from anthropic import AsyncAnthropic, APITimeoutError, RateLimitError

async def execute_with_timeout(test_case, system_prompt, model, timeout=60):
    """Execute test with timeout."""
    try:
        async with AsyncAnthropic() as client:
            # Use asyncio.wait_for for timeout
            message = await asyncio.wait_for(
                client.messages.create(
                    model=model,
                    max_tokens=1024,
                    messages=[...],
                ),
                timeout=timeout
            )
            return message
    except asyncio.TimeoutError:
        raise APITimeoutError(f"Request timed out after {timeout}s")
    except RateLimitError as e:
        # SDK automatically retries 429 errors with exponential backoff
        # If we get here, all retries failed
        raise
```

### Pattern 3: Progress Tracking for Batch Operations
**What:** Track batch execution progress on backend, poll from frontend
**When to use:** Batch execution of multiple tests
**Example:**
```python
# Backend: In-memory progress tracking
from typing import Dict
from dataclasses import dataclass

@dataclass
class BatchProgress:
    total: int
    completed: int
    failed: int
    current_test_id: str | None

# In-memory store (could use Redis for multi-worker)
batch_progress: Dict[str, BatchProgress] = {}

@router.post("/api/executions/batch")
async def start_batch_execution(test_ids: List[str], background_tasks: BackgroundTasks):
    """Start batch execution in background."""
    batch_id = generate_id("batch")
    batch_progress[batch_id] = BatchProgress(total=len(test_ids), completed=0, failed=0, current_test_id=None)

    # Run in background
    background_tasks.add_task(execute_batch, batch_id, test_ids)

    return {"batch_id": batch_id, "status": "started"}

@router.get("/api/executions/batch/{batch_id}/progress")
async def get_batch_progress(batch_id: str):
    """Get current progress of batch execution."""
    if batch_id not in batch_progress:
        raise HTTPException(404, "Batch not found")
    return batch_progress[batch_id]
```

**Frontend polling:**
```javascript
// Source: React useEffect patterns
function useBatchProgress(batchId) {
  const [progress, setProgress] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!batchId || isComplete) return;

    const controller = new AbortController();
    const interval = setInterval(async () => {
      try {
        const data = await apiGet(`/executions/batch/${batchId}/progress`, {
          signal: controller.signal
        });
        setProgress(data);

        if (data.completed + data.failed >= data.total) {
          setIsComplete(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Progress fetch failed:', err);
        }
      }
    }, 1000); // Poll every second

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [batchId, isComplete]);

  return { progress, isComplete };
}
```

### Pattern 4: Accuracy Calculation
**What:** Compare extracted lineup against ground truth with detailed breakdown
**When to use:** After every successful extraction
**Example:**
```python
# Source: Python set operations for string comparison
from typing import List, Dict

def calculate_accuracy(extracted: List[str], ground_truth: List[str]) -> Dict:
    """
    Calculate accuracy with detailed breakdown.

    Uses case-insensitive comparison per CONTEXT.md decisions.

    Returns:
        {
            "total_ground_truth": int,
            "total_extracted": int,
            "matched": int,
            "accuracy_percentage": float,
            "missed": List[str],  # In ground truth but not extracted
            "extra": List[str],   # Extracted but not in ground truth
            "matched_artists": List[str]
        }
    """
    # Normalize to lowercase for case-insensitive comparison
    extracted_normalized = {artist.strip().lower() for artist in extracted}
    ground_truth_normalized = {artist.strip().lower() for artist in ground_truth}

    # Find matches
    matched = extracted_normalized & ground_truth_normalized
    missed = ground_truth_normalized - extracted_normalized
    extra = extracted_normalized - ground_truth_normalized

    # Calculate percentage
    if len(ground_truth_normalized) == 0:
        accuracy = 0.0
    else:
        accuracy = (len(matched) / len(ground_truth_normalized)) * 100

    # Map back to original casing from ground truth
    ground_truth_map = {artist.strip().lower(): artist for artist in ground_truth}
    matched_artists = [ground_truth_map[m] for m in matched]
    missed_artists = [ground_truth_map[m] for m in missed]

    return {
        "total_ground_truth": len(ground_truth_normalized),
        "total_extracted": len(extracted_normalized),
        "matched": len(matched),
        "accuracy_percentage": round(accuracy, 2),
        "missed": missed_artists,
        "extra": list(extra),
        "matched_artists": matched_artists
    }
```

### Pattern 5: Modal Overlay with React Portal
**What:** Display batch results in a modal without disrupting navigation
**When to use:** Batch execution completion
**Example:**
```javascript
// Source: https://react.dev/reference/react-dom/createPortal
import { createPortal } from 'react-dom';

function BatchResultsModal({ results, onClose }) {
  if (!results) return null;

  const modalContent = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Batch Execution Results</h2>
        <div className="results-summary">
          <p>Total tests: {results.total}</p>
          <p>Perfect scores (100%): {results.perfect_count}</p>
          <p>Average accuracy: {results.average_accuracy}%</p>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );

  // Render into #modal-root (add to index.html)
  return createPortal(modalContent, document.getElementById('modal-root'));
}
```

### Anti-Patterns to Avoid
- **Streaming responses for this use case:** Streaming is designed for real-time token generation, not for structured JSON extraction. Use standard (non-streaming) messages endpoint.
- **Client-side API keys:** Never pass ANTHROPIC_API_KEY to frontend. Always proxy through backend.
- **Polling too frequently:** Polling every 100ms creates unnecessary load. 1-2 second intervals are sufficient for progress updates.
- **Blocking the main thread:** Always use async/await for API calls, never synchronous requests.
- **Ignoring rate limit headers:** SDK handles retries, but you should still respect retry-after header for failed requests.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential backoff for rate limits | Custom retry counter | Anthropic SDK's built-in retries | SDK automatically retries with proper backoff for 429 errors (2 retries default) |
| Request timeouts | Try/except with custom timer | `asyncio.wait_for()` | Properly cancels the task and raises TimeoutError |
| Modal accessibility | Custom overlay div | React Portal + semantic HTML | Portals render outside DOM hierarchy, proper focus management |
| JSON parsing from Claude | Regex extraction | `json.loads()` on response.content[0].text | Claude returns structured text; parse directly |
| Case-insensitive string comparison | Manual lowercasing loops | Python set operations with normalized strings | O(n) complexity, handles duplicates correctly |

**Key insight:** The Anthropic SDK already handles the complex networking problems (retries, backoff, timeouts). Don't reimplement what the SDK provides.

## Common Pitfalls

### Pitfall 1: Not Handling Partial Batch Failures
**What goes wrong:** Batch execution stops on first error, losing all progress
**Why it happens:** Default behavior is to raise exceptions, which interrupts the loop
**How to avoid:** Wrap each test execution in try/except, collect results, continue on failure
**Warning signs:** Tests after a failed test never run; batch execution is all-or-nothing

**Prevention code:**
```python
async def execute_batch(batch_id: str, test_ids: List[str]):
    results = []
    for test_id in test_ids:
        try:
            result = await execute_single_test(test_id)
            results.append({"test_id": test_id, "status": "success", "result": result})
        except Exception as e:
            logger.error(f"Test {test_id} failed: {e}")
            results.append({"test_id": test_id, "status": "failed", "error": str(e)})
        finally:
            batch_progress[batch_id].completed += 1
    return results
```

### Pitfall 2: Image Format Mismatches
**What goes wrong:** Claude API rejects images with "unsupported media type" error
**Why it happens:** Sending wrong media_type or using unsupported formats
**How to avoid:** Validate image format before sending, use only jpeg/png/gif/webp
**Warning signs:** 400 Bad Request errors mentioning image format

**Prevention code:**
```python
SUPPORTED_FORMATS = {"image/jpeg", "image/png", "image/gif", "image/webp"}

def get_media_type(image_hash: str) -> str:
    """Determine media type from stored image."""
    image_path = IMAGES_DIR / image_hash
    # Use Pillow (already installed) to detect format
    from PIL import Image
    with Image.open(image_path) as img:
        format_map = {
            "JPEG": "image/jpeg",
            "PNG": "image/png",
            "GIF": "image/gif",
            "WEBP": "image/webp"
        }
        media_type = format_map.get(img.format)
        if media_type not in SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported image format: {img.format}")
        return media_type
```

### Pitfall 3: Memory Leaks from Unclosed AbortControllers
**What goes wrong:** Frontend memory grows over time, browser slows down
**Why it happens:** Not cleaning up AbortController in useEffect cleanup
**How to avoid:** Always abort and clear intervals in useEffect return function
**Warning signs:** Performance degradation after multiple batch runs

**Prevention code:**
```javascript
useEffect(() => {
  const controller = new AbortController();
  const interval = setInterval(() => {
    fetchProgress(controller.signal);
  }, 1000);

  // CRITICAL: Cleanup function
  return () => {
    controller.abort();  // Cancel in-flight requests
    clearInterval(interval);  // Stop polling
  };
}, [batchId]);
```

### Pitfall 4: Race Conditions with Rapid Re-renders
**What goes wrong:** Progress bar jumps backwards or shows stale data
**Why it happens:** Multiple progress fetches complete out of order
**How to avoid:** Use batch ID as useEffect dependency, ignore stale responses
**Warning signs:** Progress decreases, completed count jumps around

**Prevention code:**
```javascript
// Use a ref to track the current batch ID
const currentBatchRef = useRef(batchId);

useEffect(() => {
  currentBatchRef.current = batchId;

  const fetchProgress = async () => {
    const data = await apiGet(`/executions/batch/${batchId}/progress`);

    // Ignore if batch ID changed while request was in flight
    if (currentBatchRef.current === batchId) {
      setProgress(data);
    }
  };

  // ... rest of polling logic
}, [batchId]);
```

### Pitfall 5: Not Parsing JSON from Claude Response
**What goes wrong:** Response text includes markdown code fences or extra text
**Why it happens:** Claude sometimes wraps JSON in ```json ... ``` blocks
**How to avoid:** Extract JSON from response text, handle both clean and wrapped formats
**Warning signs:** JSON.parse() errors, "Unexpected token" errors

**Prevention code:**
```python
import json
import re

def parse_claude_json_response(response_text: str) -> List[str]:
    """
    Parse lineup from Claude response, handling wrapped JSON.

    Claude may return:
    1. Clean JSON: ["Artist 1", "Artist 2"]
    2. Wrapped: ```json\n["Artist 1", "Artist 2"]\n```
    3. With explanation: "Here's the lineup:\n```json\n[...]\n```"
    """
    # Try direct JSON parse first
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    # Extract JSON from markdown code fence
    json_match = re.search(r'```(?:json)?\s*\n(.*?)\n```', response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Last resort: try to find array pattern
    array_match = re.search(r'\[.*\]', response_text, re.DOTALL)
    if array_match:
        try:
            return json.loads(array_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from response: {response_text[:100]}...")
```

## Code Examples

Verified patterns from official sources:

### Complete Text-Based Execution
```python
# Source: Anthropic SDK + FastAPI patterns
from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/executions")

@router.post("/{test_id}/text")
async def execute_text_test(test_id: str):
    """
    Execute text-based test (festival name → lineup).
    """
    # Load test case
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(404, "Test case not found")

    # Get config from request or use defaults
    system_prompt = "Extract the festival lineup. Return a JSON array of artist names."
    model = "claude-sonnet-4-20250514"

    # Execute with Claude
    async with AsyncAnthropic() as client:
        try:
            message = await asyncio.wait_for(
                client.messages.create(
                    model=model,
                    max_tokens=1024,
                    messages=[
                        {
                            "role": "user",
                            "content": f"{system_prompt}\n\nFestival: {test_case.name}"
                        }
                    ]
                ),
                timeout=60.0
            )

            # Parse response
            response_text = message.content[0].text
            extracted_lineup = parse_claude_json_response(response_text)

            # Calculate accuracy
            accuracy = calculate_accuracy(extracted_lineup, test_case.lineup)

            return {
                "test_id": test_id,
                "status": "success",
                "extracted_lineup": extracted_lineup,
                "accuracy": accuracy,
                "metadata": {
                    "model": model,
                    "system_prompt": system_prompt,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

        except asyncio.TimeoutError:
            raise HTTPException(504, "Request timed out after 60s")
        except Exception as e:
            raise HTTPException(500, f"Execution failed: {str(e)}")
```

### Complete Image-Based Execution
```python
# Source: https://platform.claude.com/docs/en/api/messages
import base64
from pathlib import Path

@router.post("/{test_id}/image")
async def execute_image_test(test_id: str):
    """
    Execute image-based test (festival image → lineup).
    """
    # Load test case
    test_case = load_test_case(test_id)
    if not test_case:
        raise HTTPException(404, "Test case not found")

    if not test_case.image_hash:
        raise HTTPException(400, "Test case has no image")

    # Load and encode image
    image_path = IMAGES_DIR / test_case.image_hash
    media_type = get_media_type(test_case.image_hash)

    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    system_prompt = "Extract the festival lineup from this image. Return a JSON array of artist names."
    model = "claude-sonnet-4-20250514"

    # Execute with Claude
    async with AsyncAnthropic() as client:
        try:
            message = await asyncio.wait_for(
                client.messages.create(
                    model=model,
                    max_tokens=1024,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": media_type,
                                        "data": image_data,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": system_prompt
                                }
                            ],
                        }
                    ]
                ),
                timeout=60.0
            )

            # Parse and evaluate (same as text-based)
            response_text = message.content[0].text
            extracted_lineup = parse_claude_json_response(response_text)
            accuracy = calculate_accuracy(extracted_lineup, test_case.lineup)

            return {
                "test_id": test_id,
                "status": "success",
                "extracted_lineup": extracted_lineup,
                "accuracy": accuracy,
                "metadata": {
                    "model": model,
                    "system_prompt": system_prompt,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

        except asyncio.TimeoutError:
            raise HTTPException(504, "Request timed out after 60s")
        except Exception as e:
            raise HTTPException(500, f"Execution failed: {str(e)}")
```

### Frontend Execution Hook
```javascript
// Source: React hooks patterns + AbortController
import { useState } from 'react';
import { apiPost } from '../api/client';

export function useTestExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const executeTest = async (testId, mode = 'image') => {
    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiPost(`/executions/${testId}/${mode}`);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const reset = () => {
    setIsExecuting(false);
    setResult(null);
    setError(null);
  };

  return { executeTest, isExecuting, result, error, reset };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| requests library | httpx with async | 2021-2022 | Async-first HTTP client for FastAPI async endpoints |
| Manual JSON extraction | Structured outputs (JSON mode) | 2024 | Claude models better at returning clean JSON (but still need parsing fallback) |
| FuzzyWuzzy | RapidFuzz (thefuzz) | 2021 | 10x faster fuzzy matching, but not needed for this phase (strict matching) |
| Redux for async state | Built-in React hooks + React 18 batching | 2022 | Simpler state management without external library |
| Background task queues (Celery) | FastAPI BackgroundTasks | 2019+ | Sufficient for simple batch operations without Redis/RabbitMQ |

**Deprecated/outdated:**
- **FuzzyWuzzy (original):** Renamed to thefuzz in 2021 due to licensing. Use `pip install thefuzz` if needed.
- **Anthropic SDK <0.20:** Earlier versions had different API surface. Ensure >=0.40 for latest features.
- **React class components with lifecycle methods:** Use hooks (useEffect, useState) for all async operations.

## Open Questions

Things that couldn't be fully resolved:

1. **Result Persistence Strategy**
   - What we know: Atomic write pattern exists in codebase, in-memory is simpler
   - What's unclear: User preference for result history vs. simplicity
   - Recommendation: Start with in-memory, add JSON persistence in later phase if needed. Context says "only latest result matters" so in-memory is sufficient.

2. **Exact Timeout Duration**
   - What we know: Context says "Claude decides reasonable default"
   - What's unclear: Optimal timeout for image processing (text is fast, images vary)
   - Recommendation: 60 seconds for both text and image tests. Monitor and adjust based on usage. SDK timeout is separate from asyncio.wait_for timeout; use asyncio for application-level control.

3. **Batch Cancellation Implementation**
   - What we know: Context requires cancel button that keeps partial results
   - What's unclear: Whether to cancel in-flight request or just stop processing new tests
   - Recommendation: Stop processing new tests but let current request complete. Use a cancellation flag checked between tests, not AbortController for API (would lose that result).

4. **Progress Bar Styling**
   - What we know: Context says "Claude's discretion"
   - What's unclear: Whether to use a library or custom CSS
   - Recommendation: Custom CSS with semantic HTML `<progress>` element. No library needed for simple linear progress.

## Sources

### Primary (HIGH confidence)
- [Anthropic Python SDK GitHub](https://github.com/anthropics/anthropic-sdk-python) - Installation, async support, basic usage
- [Claude Messages API Documentation](https://platform.claude.com/docs/en/api/messages) - Vision capability, image formats, message structure
- [Claude Rate Limits Documentation](https://platform.claude.com/docs/en/api/rate-limits) - Rate limit headers, retry-after, backoff strategy
- [React createPortal Reference](https://react.dev/reference/react-dom/createPortal) - Portal API for modals
- Existing codebase - Atomic write pattern, FastAPI async patterns, API client structure

### Secondary (MEDIUM confidence)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) - BackgroundTasks class usage
- [React AbortController patterns](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) - Cancellation for fetch requests
- [Python asyncio.wait_for](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for) - Timeout implementation

### Tertiary (LOW confidence)
- Web search results on React progress bars, batch operations - General patterns, not specific recommendations
- Web search results on fuzzy matching libraries - Informational only, not needed for this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK documentation verified, already using FastAPI + React
- Architecture: HIGH - Patterns verified from official docs and existing codebase
- Pitfalls: MEDIUM - Based on common issues in similar projects and SDK docs, not production experience with this exact stack

**Research date:** 2026-01-23
**Valid until:** ~60 days (stable domain, Anthropic SDK changes infrequently)
